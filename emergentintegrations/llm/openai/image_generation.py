import base64
from typing import List, Optional

# A tiny valid 1x1 PNG (base64) used as placeholder image when no real API is configured.
_SAMPLE_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNg"
    "YAAAAAMAASsJTYQAAAAASUVORK5CYII="
)
_SAMPLE_PNG_BYTES = base64.b64decode(_SAMPLE_PNG_B64)

class OpenAIImageGeneration:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    async def generate_images(self, prompt: str, model: str = "gpt-image-1", number_of_images: int = 1, quality: str = "low") -> List[bytes]:
        """
        Minimal async implementation returning placeholder images when no real API
        key is configured. In production, replace with actual API calls.
        """
        # If api_key is missing, return a placeholder image so endpoints can respond
        if not self.api_key:
            return [_SAMPLE_PNG_BYTES for _ in range(max(1, number_of_images))]
        # If you do have an API key, you should implement the actual call here.
        # For now, return the sample image to keep behavior predictable.
        return [_SAMPLE_PNG_BYTES for _ in range(max(1, number_of_images))]
