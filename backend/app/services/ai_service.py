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

    async def check_ollama_status(self) -> Dict[str, Any]:
        """Check whether Ollama is reachable and the configured models are installed."""
        try:
            async with httpx.AsyncClient(timeout=3.5) as client:
                response = await client.get(f"{self.base_url}/api/tags")
            if response.status_code != 200:
                return {
                    "available": False,
                    "base_url": self.base_url,
                    "configured_model": self.model,
                    "error": f"Ollama returned HTTP {response.status_code}",
                    "setup_guide": self._get_setup_guide(),
                }

            data = response.json()
            models = [item.get("name", "") for item in data.get("models", [])]
            return {
                "available": True,
                "base_url": self.base_url,
                "configured_model": self.model,
                "configured_vision_model": self.vision_model,
                "model_ready": any(self.model == name or name.startswith(self.model + ":") for name in models),
                "vision_ready": any(
                    self.vision_model == name or name.startswith(self.vision_model + ":")
                    for name in models
                ),
                "installed_models": models,
                "message": "Local Ollama AI service is active and responding.",
            }
        except httpx.RequestError as exc:
            return {
                "available": False,
                "base_url": self.base_url,
                "configured_model": self.model,
                "error": f"Could not connect to Ollama at {self.base_url}: {exc}",
                "setup_guide": self._get_setup_guide(),
            }

    def _get_setup_guide(self) -> Dict[str, Any]:
        return {
            "title": "How to Run Local Open-Source AI with Ollama",
            "steps": [
                "1. Install Ollama from https://ollama.com",
                "2. Start Ollama using the desktop app or `ollama serve`.",
                f"3. Pull the text model: `ollama pull {self.model}`.",
                f"4. Pull the vision model: `ollama pull {self.vision_model}`.",
                "5. Refresh PlantCare AI and retry.",
            ],
            "privacy_note": (
                "Inference runs locally through Ollama. Plant photos and questions are "
                "sent to the configured local Ollama service."
            ),
        }

    @staticmethod
    def _extract_json_from_text(text: str) -> Dict[str, Any]:
        """Parse a JSON object, tolerating surrounding Markdown fences or prose."""
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
                raise ValueError(f"Could not parse JSON from AI response: {text[:500]!r}")
            value = json.loads(text[start:end + 1])

        if not isinstance(value, dict):
            raise ValueError("The AI response JSON must be an object.")
        return value

    async def analyze_plant_health(
        self,
        image_bytes: Optional[bytes] = None,
        symptoms: Optional[str] = None,
        plant_context: Optional[Dict[str, Any]] = None,
    ) -> PlantHealthAnalysisResponse:
        """Analyze plant health using Ollama, attaching an image when supplied."""
        status_info = await self.check_ollama_status()
        if not status_info.get("available"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "Local Ollama AI service is offline.",
                    "setup_guide": status_info.get("setup_guide"),
                },
            )

        has_image = bool(image_bytes)
        if has_image and not status_info.get("vision_ready", False):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Vision model '{self.vision_model}' is not installed or unavailable.",
            )

        use_vision = has_image
        selected_model = self.vision_model if use_vision else self.model

        context_lines: List[str] = []
        if plant_context:
            for key, label in (
                ("common_name", "Plant"),
                ("category", "Category"),
                ("location_type", "Growing location"),
                ("watering_frequency_days", "Watering interval (days)"),
                ("sunlight_requirement", "Sunlight"),
            ):
                value = plant_context.get(key)
                if value is not None:
                    context_lines.append(f"{label}: {value}")
        context_text = "\n".join(context_lines)
        symptom_text = (symptoms or "No symptoms provided; assess visible plant health.").strip()

        system_prompt = """
You are a careful plant-health diagnostic assistant. Analyze the image and symptom
details. Do not claim certainty when evidence is insufficient. Return ONLY one valid
JSON object with these fields:
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
Severity must be mild, moderate, severe, critical, or healthy. confidence_score must
be a number from 0 to 1. Keep the answer concise. Do not use Markdown fences.
""".strip()

        user_message: Dict[str, Any] = {
            "role": "user",
            "content": (
                f"Diagnose this plant.\n{context_text}\n"
                f"Observed symptoms: {symptom_text}"
            ),
        }
        if has_image:
            user_message["images"] = [base64.b64encode(image_bytes).decode("ascii")]

        payload = {
            "model": selected_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                user_message,
            ],
            "stream": False,
            "format": "json",
            "options": {
                "num_ctx": 8192,
                "num_predict": 512,
                "temperature": 0.1,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)

            if response.status_code != 200:
                logger.error("Ollama diagnosis HTTP %s: %s", response.status_code, response.text[:1500])
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Ollama returned error: {response.text[:1000]}",
                )

            data = response.json()
            message = data.get("message") or {}
            raw_content = (message.get("content") or "").strip()
            logger.info(
                "Plant Doctor response model=%s vision=%s done=%s reason=%s "
                "prompt_tokens=%s output_tokens=%s content_length=%s",
                data.get("model", selected_model),
                use_vision,
                data.get("done"),
                data.get("done_reason"),
                data.get("prompt_eval_count"),
                data.get("eval_count"),
                len(raw_content),
            )

            if not raw_content:
                logger.error(
                    "Ollama returned empty diagnosis: model=%s done=%s reason=%s "
                    "prompt_eval_count=%s eval_count=%s",
                    data.get("model", selected_model),
                    data.get("done"),
                    data.get("done_reason"),
                    data.get("prompt_eval_count"),
                    data.get("eval_count"),
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="The local vision model returned an empty response. Check the backend log.",
                )

            parsed = self._extract_json_from_text(raw_content)
            result = PlantHealthAnalysisResponse(**parsed)
            result.is_vision_model = use_vision
            return result

        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Local AI inference timed out after {self.timeout:g} seconds.",
            ) from exc
        except ValidationError as exc:
            logger.exception("Plant diagnosis response validation failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI response did not match the plant diagnosis schema.",
            ) from exc
        except HTTPException:
            raise
        except (ValueError, json.JSONDecodeError) as exc:
            logger.exception("Could not parse plant diagnosis JSON")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI model returned invalid JSON.",
            ) from exc
        except httpx.RequestError as exc:
            logger.exception("Could not connect to Ollama for plant diagnosis")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not connect to the local Ollama service.",
            ) from exc

    async def generate_gardening_advice(
        self,
        messages: List[Dict[str, str]],
        user_plants: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Chat with the local model about gardening and the user's saved plants."""
        status_info = await self.check_ollama_status()
        if not status_info.get("available"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "Local Ollama AI service is offline.",
                    "setup_guide": status_info.get("setup_guide"),
                },
            )

        plants_referenced: List[str] = []
        plants_context = ""
        if user_plants:
            plants_summary = ", ".join(
                f"{plant.get('common_name')} ({plant.get('category')}, {plant.get('location_type')})"
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
            "You are PlantCare AI, a dedicated open-source gardening companion. "
            "Keep answers concise, warm, and actionable. Encourage real-world gardening "
            "actions such as checking soil moisture, inspecting stems, and observing sunlight. "
            "End with exactly 2 or 3 suggested follow-up questions formatted as: "
            "FOLLOW_UPS: [Question 1] | [Question 2] | [Question 3]\n"
            f"{plants_context}"
        )
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Ollama returned error: {response.text[:1000]}",
                )

            content = (response.json().get("message") or {}).get("content", "").strip()
            if not content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="The local AI model returned an empty chat response.",
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
                    "What organic fertilizer is suitable for this plant?",
                    "When should I prune this plant?",
                ]

            return {
                "reply": reply_text.strip(),
                "suggested_followups": follow_ups[:3],
                "plants_referenced": plants_referenced,
                "is_ai_generated": True,
            }
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Local AI chat inference timed out after {self.timeout:g} seconds.",
            ) from exc
        except HTTPException:
            raise
        except httpx.RequestError as exc:
            logger.exception("Chat AI request failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not connect to the local Ollama service.",
            ) from exc

    async def generate_garden_plan(self, req_data: Dict[str, Any]) -> GardenPlanGenerated:
        """Generate a structured garden plan using the local Ollama model."""
        status_info = await self.check_ollama_status()
        if not status_info.get("available"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "Local Ollama AI service is offline.",
                    "setup_guide": status_info.get("setup_guide"),
                },
            )

        system_prompt = """
You are a sustainable gardening and permaculture planner. Return ONLY valid JSON:
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
Use the user's constraints. Keep the plan practical and concise.
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
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "stream": False,
            "format": "json",
            "options": {"num_ctx": 8192, "num_predict": 1200, "temperature": 0.2},
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Ollama returned error: {response.text[:1000]}",
                )
            content = (response.json().get("message") or {}).get("content", "").strip()
            parsed = self._extract_json_from_text(content)
            return GardenPlanGenerated(**parsed)
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Garden plan generation timed out after {self.timeout:g} seconds.",
            ) from exc
        except ValidationError as exc:
            logger.exception("Garden plan response validation failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI model returned an invalid garden plan structure.",
            ) from exc
        except HTTPException:
            raise
        except (ValueError, json.JSONDecodeError) as exc:
            logger.exception("Could not parse garden plan JSON")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI model returned invalid garden plan JSON.",
            ) from exc
        except httpx.RequestError as exc:
            logger.exception("Could not connect to Ollama for garden plan")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not connect to the local Ollama service.",
            ) from exc


ai_service = AIService()
