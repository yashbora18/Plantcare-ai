
import base64
import json
import logging
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException, status
from pydantic import ValidationError

from backend.app.config import settings
from backend.app.schemas.assessment import PlantHealthAnalysisResponse
from backend.app.schemas.garden_plan import GardenPlanGenerated

logger = logging.getLogger("plantcare.ai")


class AIService:
    def __init__(self) -> None:
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.vision_model = settings.OLLAMA_VISION_MODEL
        self.timeout = float(settings.OLLAMA_TIMEOUT_SECONDS)

        self.gemini_api_key = settings.GEMINI_API_KEY.strip()
        self.gemini_model = settings.GEMINI_MODEL
        self.gemini_timeout = float(settings.GEMINI_TIMEOUT_SECONDS)

    @property
    def uses_gemini(self) -> bool:
        return bool(self.gemini_api_key)

    def _gemini_url(self) -> str:
        return (
            "https://generativelanguage.googleapis.com/v1beta/"
            f"models/{self.gemini_model}:generateContent"
        )

    async def _generate_gemini(
        self,
        system_prompt: str,
        user_content: Any,
        *,
        json_response: bool = False,
        temperature: float = 0.2,
    ) -> str:
        """Generate content through Gemini without exposing the API key."""

        if not self.gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API key is not configured on the backend.",
            )

        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": (
                        user_content
                        if isinstance(user_content, list)
                        else [{"text": str(user_content)}]
                    ),
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                **(
                    {"responseMimeType": "application/json"}
                    if json_response
                    else {}
                ),
            },
        }

        try:
            async with httpx.AsyncClient(
                timeout=self.gemini_timeout
            ) as client:
                response = await client.post(
                    self._gemini_url(),
                    params={"key": self.gemini_api_key},
                    json=payload,
                )

            if response.status_code != 200:
                logger.error(
                    "Gemini API returned HTTP %s: %s",
                    response.status_code,
                    response.text[:1200],
                )

                if response.status_code == 429:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=(
                            "Gemini's request limit or quota has been reached. "
                            "Please try again later or check your API quota."
                        ),
                    )

                if response.status_code in (400, 401, 403, 404):
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=(
                            "Gemini rejected the request. Check the configured "
                            "API key, model name, and API access in Google AI Studio."
                        ),
                    )

                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini could not complete the AI request.",
                )

            data = response.json()
            candidates = data.get("candidates") or []

            if not candidates:
                block_reason = (
                    data.get("promptFeedback", {}).get("blockReason")
                )
                logger.warning(
                    "Gemini returned no candidates; block_reason=%s",
                    block_reason,
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=(
                        "Gemini did not return a usable response. "
                        "Please revise the request and try again."
                    ),
                )

            parts = (
                candidates[0]
                .get("content", {})
                .get("parts", [])
            )
            result = "".join(
                part.get("text", "")
                for part in parts
                if isinstance(part, dict)
            ).strip()

            if not result:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini returned an empty response.",
                )

            return result

        except httpx.TimeoutException as exc:
            logger.warning("Gemini request timed out")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Gemini took too long to respond. Please try again.",
            ) from exc

        except httpx.RequestError as exc:
            logger.exception("Gemini connection failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not connect to the Gemini AI service.",
            ) from exc

    async def check_ollama_status(self) -> Dict[str, Any]:
        """Check local Ollama. Gemini deployments do not need this check."""

        try:
            async with httpx.AsyncClient(timeout=3.5) as client:
                response = await client.get(
                    f"{self.base_url}/api/tags"
                )

            if response.status_code != 200:
                return {
                    "available": False,
                    "provider": "ollama",
                    "configured_model": self.model,
                    "message": "Ollama is unavailable.",
                    "setup_guide": self._get_setup_guide(),
                }

            models = [
                item.get("name", "")
                for item in response.json().get("models", [])
            ]

            return {
                "available": True,
                "provider": "ollama",
                "configured_model": self.model,
                "configured_vision_model": self.vision_model,
                "model_ready": any(
                    name == self.model
                    or name.startswith(self.model + ":")
                    for name in models
                ),
                "vision_ready": any(
                    name == self.vision_model
                    or name.startswith(self.vision_model + ":")
                    for name in models
                ),
                "installed_models": models,
                "message": "Local Ollama AI service is responding.",
            }

        except httpx.RequestError:
            return {
                "available": False,
                "provider": "ollama",
                "configured_model": self.model,
                "message": "Local Ollama AI service is offline.",
                "setup_guide": self._get_setup_guide(),
            }

    def _get_setup_guide(self) -> Dict[str, Any]:
        return {
            "title": "Run local AI with Ollama",
            "steps": [
                "Install Ollama from https://ollama.com.",
                "Start the Ollama application.",
                f"Run: ollama pull {self.model}",
                f"Run: ollama pull {self.vision_model}",
                "Refresh PlantCare AI and retry.",
            ],
        }

    @staticmethod
    def _extract_json_from_text(text: str) -> Dict[str, Any]:
        """Parse a JSON object, tolerating Markdown fences or surrounding text."""

        text = (text or "").strip()

        if not text:
            raise ValueError("The AI model returned empty content.")

        if text.startswith("```"):
            lines = text.splitlines()
            if lines and lines[0].strip().startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        try:
            value = json.loads(text)
        except json.JSONDecodeError:
            start, end = text.find("{"), text.rfind("}")
            if start < 0 or end <= start:
                raise ValueError("Could not parse JSON from AI response.")
            value = json.loads(text[start : end + 1])

        if not isinstance(value, dict):
            raise ValueError("The AI response JSON must be an object.")

        return value

    @staticmethod
    def _image_mime_type(image_bytes: bytes) -> str:
        """Detect supported image formats from their file signatures."""

        if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        if image_bytes.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        if image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP":
            return "image/webp"

        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image format. Upload a JPG, PNG, or WebP image.",
        )

    async def analyze_plant_health(
        self,
        image_bytes: Optional[bytes] = None,
        symptoms: Optional[str] = None,
        plant_context: Optional[Dict[str, Any]] = None,
    ) -> PlantHealthAnalysisResponse:
        """Diagnose plant health using Gemini or local Ollama."""

        has_image = bool(image_bytes)
        context_lines: List[str] = []

        if plant_context:
            fields = (
                ("common_name", "Plant"),
                ("category", "Category"),
                ("location_type", "Growing location"),
                ("watering_frequency_days", "Watering interval (days)"),
                ("sunlight_requirement", "Sunlight"),
            )
            for key, label in fields:
                value = plant_context.get(key)
                if value is not None:
                    context_lines.append(f"{label}: {value}")

        context_text = "\n".join(context_lines)
        symptom_text = (
            symptoms or "No symptoms provided; assess visible plant health."
        ).strip()

        system_prompt = """
You are a careful plant-health diagnostic assistant.
Analyze the supplied plant photo and symptoms. Do not claim certainty
when evidence is insufficient. Return ONLY one valid JSON object with:
{
  "primary_issue": "Short diagnosis",
  "severity": "mild",
  "confidence_score": 0.7,
  "visible_symptoms": ["Observed symptom"],
  "possible_causes": ["Possible cause"],
  "recommended_steps": ["Actionable step"],
  "care_adjustments": {
    "watering": "Specific advice",
    "sunlight": "Specific advice",
    "soil": "Specific advice",
    "pest_management": "Specific advice"
  },
  "preventive_measures": ["Preventive action"],
  "expert_consultation_needed": false,
  "disclaimer": "Visual AI assessments are estimates."
}
Severity must be mild, moderate, severe, critical, or healthy.
confidence_score must be a number from 0 to 1.
Do not invent visual symptoms if no image is supplied.
Keep the recommendations practical and concise.
""".strip()

        user_text = (
            f"Diagnose this plant.\n{context_text}\n"
            f"Observed symptoms: {symptom_text}"
        )

        try:
            if self.uses_gemini:
                parts: List[Dict[str, Any]] = [{"text": user_text}]

                if has_image:
                    mime_type = self._image_mime_type(image_bytes)
                    parts.append(
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64.b64encode(
                                    image_bytes
                                ).decode("ascii"),
                            }
                        }
                    )

                raw = await self._generate_gemini(
                    system_prompt,
                    parts,
                    json_response=True,
                    temperature=0.1,
                )
            else:
                status_info = await self.check_ollama_status()
                if not status_info.get("available"):
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail={
                            "error": "Local Ollama AI service is offline.",
                            "setup_guide": status_info.get("setup_guide"),
                        },
                    )

                if has_image and not status_info.get("vision_ready", False):
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=(
                            f"Vision model '{self.vision_model}' "
                            "is not installed or available."
                        ),
                    )

                selected_model = self.vision_model if has_image else self.model
                user_message: Dict[str, Any] = {
                    "role": "user",
                    "content": user_text,
                }
                if has_image:
                    user_message["images"] = [
                        base64.b64encode(image_bytes).decode("ascii")
                    ]

                payload = {
                    "model": selected_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        user_message,
                    ],
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.1, "num_predict": 512},
                }

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/api/chat", json=payload
                    )

                if response.status_code != 200:
                    logger.error(
                        "Ollama diagnosis error: %s",
                        response.text[:1000],
                    )
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="The local AI service could not diagnose the plant.",
                    )

                raw = (
                    response.json().get("message", {}).get("content", "")
                ).strip()

            parsed = self._extract_json_from_text(raw)
            result = PlantHealthAnalysisResponse(**parsed)
            result.is_vision_model = has_image
            return result

        except HTTPException:
            raise
        except ValidationError as exc:
            logger.exception("Plant diagnosis schema validation failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI response did not match the plant diagnosis schema.",
            ) from exc
        except (ValueError, json.JSONDecodeError) as exc:
            logger.exception("Plant diagnosis JSON parsing failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI model returned invalid diagnosis data.",
            ) from exc
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Plant diagnosis timed out. Please try again.",
            ) from exc
        except httpx.RequestError as exc:
            logger.exception("Plant diagnosis request failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not connect to the configured AI service.",
            ) from exc

    async def generate_gardening_advice(
        self,
        messages: List[Dict[str, str]],
        user_plants: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Chat about gardening, using Gemini when configured."""

        plants_referenced: List[str] = []
        plants_context = ""

        if user_plants:
            plants_summary = ", ".join(
                f"{plant.get('common_name')} "
                f"({plant.get('category')}, {plant.get('location_type')})"
                for plant in user_plants[:10]
            )
            plants_context = (
                f"\nUser's current garden collection: {plants_summary}. "
                "When applicable, tailor answers to these plants."
            )
            plants_referenced = [
                str(plant.get("common_name"))
                for plant in user_plants[:5]
                if plant.get("common_name")
            ]

        system_prompt = (
            "You are PlantCare AI, a friendly and careful gardening companion. "
            "Keep answers concise, warm, and actionable. Encourage real-world "
            "actions such as checking soil moisture, inspecting stems, and "
            "observing sunlight. Do not invent facts about the user's garden. "
            "End your response with exactly 2 or 3 suggested follow-up questions "
            "formatted as: FOLLOW_UPS: Question 1 | Question 2 | Question 3. "
            f"{plants_context}"
        )

        try:
            if self.uses_gemini:
                # Convert chat history into Gemini's user/model roles.
                history: List[Dict[str, Any]] = []
                for message in messages[-20:]:
                    content = str(message.get("content", "")).strip()
                    if not content:
                        continue
                    role = str(message.get("role", "user")).lower()
                    gemini_role = (
                        "model"
                        if role in ("assistant", "model", "ai")
                        else "user"
                    )
                    history.append(
                        {"role": gemini_role, "parts": [{"text": content}]}
                    )

                if not history or history[-1]["role"] != "user":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Please send a user message to start the chat.",
                    )

                # The REST API supports multi-turn contents. Keep the system
                # instruction separate and send the supplied conversation.
                payload = {
                    "systemInstruction": {
                        "parts": [{"text": system_prompt}]
                    },
                    "contents": history,
                    "generationConfig": {"temperature": 0.5},
                }

                async with httpx.AsyncClient(
                    timeout=self.gemini_timeout
                ) as client:
                    response = await client.post(
                        self._gemini_url(),
                        params={"key": self.gemini_api_key},
                        json=payload,
                    )

                if response.status_code != 200:
                    logger.error(
                        "Gemini chat returned HTTP %s: %s",
                        response.status_code,
                        response.text[:1000],
                    )
                    if response.status_code == 429:
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Gemini quota reached. Please try again later.",
                        )
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Gemini could not complete the chat response.",
                    )

                candidates = response.json().get("candidates") or []
                parts = (
                    candidates[0].get("content", {}).get("parts", [])
                    if candidates
                    else []
                )
                content = "".join(
                    part.get("text", "")
                    for part in parts
                    if isinstance(part, dict)
                ).strip()
            else:
                status_info = await self.check_ollama_status()
                if not status_info.get("available"):
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail={
                            "error": "Local Ollama AI service is offline.",
                            "setup_guide": status_info.get("setup_guide"),
                        },
                    )

                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt}
                    ] + messages[-20:],
                    "stream": False,
                }

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/api/chat", json=payload
                    )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="The local AI service could not complete the chat.",
                    )

                content = (
                    response.json().get("message", {}).get("content", "")
                ).strip()

            if not content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="The AI service returned an empty chat response.",
                )

            follow_ups: List[str] = []
            if "FOLLOW_UPS:" in content:
                reply_text, raw_followups = content.split("FOLLOW_UPS:", 1)
                follow_ups = [
                    question.strip().strip("[]| ")
                    for question in raw_followups.split("|")
                    if question.strip()
                ]
            else:
                reply_text = content

            if not follow_ups:
                follow_ups = [
                    "How can I test soil moisture right now?",
                    "What organic fertilizer suits this plant?",
                    "When should I prune this plant?",
                ]

            return {
                "reply": reply_text.strip(),
                "suggested_followups": follow_ups[:3],
                "plants_referenced": plants_referenced,
                "is_ai_generated": True,
            }

        except HTTPException:
            raise
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Gardening chat timed out. Please try again.",
            ) from exc
        except httpx.RequestError as exc:
            logger.exception("Gardening chat connection failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not connect to the configured AI service.",
            ) from exc

    async def generate_garden_plan(
        self, req_data: Dict[str, Any]
    ) -> GardenPlanGenerated:
        """Generate a structured garden plan through Gemini or Ollama."""

        system_prompt = """
You are a sustainable gardening and permaculture planner.
Return ONLY valid JSON with this structure:
{
  "title": "Garden plan title",
  "summary": "Short overview",
  "recommended_plants": [
    {
      "name": "Common plant name",
      "scientific_name": "Botanical name",
      "category": "Herb",
      "difficulty": "Easy",
      "sunlight": "Sunlight requirement",
      "watering": "Watering schedule",
      "spacing_inches": 12,
      "companion_plants": ["Companion plant"],
      "why_recommended": "Reason for recommendation"
    }
  ],
  "preparation_steps": ["Preparation step"],
  "planting_windows": {"Spring": "Seasonal task"},
  "maintenance_schedule": ["Maintenance task"],
  "sustainable_tips": ["Sustainable tip"]
}
Use the user's constraints. Keep the plan practical, region-aware, and concise.
Do not invent precise local weather or growing-zone facts.
""".strip()

        user_content = (
            "Generate a garden plan with these constraints:\n"
            f"- Location/growing zone: {req_data.get('location_zone')}\n"
            f"- Space type: {req_data.get('space_type')}\n"
            f"- Sunlight: {req_data.get('sunlight_level')}\n"
            f"- Soil: {req_data.get('soil_type')}\n"
            f"- Budget: {req_data.get('budget_level')}\n"
            f"- Goals/preferences: {req_data.get('preferences')}\n"
        )

        try:
            if self.uses_gemini:
                raw = await self._generate_gemini(
                    system_prompt,
                    user_content,
                    json_response=True,
                    temperature=0.2,
                )
            else:
                status_info = await self.check_ollama_status()
                if not status_info.get("available"):
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail={
                            "error": "Local Ollama AI service is offline.",
                            "setup_guide": status_info.get("setup_guide"),
                        },
                    )

                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    "stream": False,
                    "format": "json",
                    "options": {
                        "num_ctx": 8192,
                        "num_predict": 1200,
                        "temperature": 0.2,
                    },
                }

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/api/chat", json=payload
                    )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="The local AI service could not generate a garden plan.",
                    )

                raw = (
                    response.json().get("message", {}).get("content", "")
                ).strip()

            parsed = self._extract_json_from_text(raw)
            return GardenPlanGenerated(**parsed)

        except HTTPException:
            raise
        except ValidationError as exc:
            logger.exception("Garden plan schema validation failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI response did not match the garden plan schema.",
            ) from exc
        except (ValueError, json.JSONDecodeError) as exc:
            logger.exception("Garden plan JSON parsing failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI model returned invalid garden plan data.",
            ) from exc
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Garden plan generation timed out. Please try again.",
            ) from exc
        except httpx.RequestError as exc:
            logger.exception("Garden plan request failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not connect to the configured AI service.",
            ) from exc


ai_service = AIService()
