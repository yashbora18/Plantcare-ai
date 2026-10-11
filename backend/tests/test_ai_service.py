import asyncio
from backend.app.services.ai_service import ai_service
from backend.app.schemas.assessment import PlantHealthAnalysisResponse

def test_ollama_status_check():
    status_info = asyncio.run(ai_service.check_ollama_status())
    assert "available" in status_info
    assert "configured_model" in status_info
    # When offline, setup guide must be provided
    if not status_info["available"]:
        assert "setup_guide" in status_info
        assert len(status_info["setup_guide"]["steps"]) > 0

def test_extract_json_from_ai_text():
    raw_markdown_json = """
    ```json
    {
      "primary_issue": "Powdery Mildew",
      "severity": "mild",
      "confidence_score": 0.88,
      "visible_symptoms": ["White powdery spots on leaf tops"],
      "possible_causes": ["High humidity with stagnant air"],
      "recommended_steps": ["Prune affected leaves", "Improve airflow"],
      "care_adjustments": {
        "watering": "Water at soil level only, do not wet foliage",
        "sunlight": "Move to brighter area",
        "soil": "Maintain good drainage",
        "pest_management": "Spray with potassium bicarbonate or diluted milk solution"
      },
      "preventive_measures": ["Space plants 12 inches apart", "Avoid overhead watering"],
      "expert_consultation_needed": false
    }
    ```
    """
    extracted = ai_service._extract_json_from_text(raw_markdown_json)
    assert extracted["primary_issue"] == "Powdery Mildew"
    
    # Validates with Pydantic
    obj = PlantHealthAnalysisResponse(**extracted)
    assert obj.severity == "mild"
    assert obj.confidence_score == 0.88
    assert len(obj.recommended_steps) == 2
