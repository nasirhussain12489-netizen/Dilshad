export async function uploadBase64ToImgBB(
  base64Data: string,
  fileName: string,
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = (apiKeyOverride || String(process.env.IMGBB_API_KEY || '').trim()).trim();

  if (!apiKey || apiKey.includes('YOUR_IMGBB_API_KEY')) {
    throw new Error('No ImgBB API key is configured. Set IMGBB_API_KEY in the environment or admin settings before upload.');
  }

  const params = new URLSearchParams({
    key: apiKey,
    image: base64Data,
    name: fileName,
  });

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ImgBB upload failed: ${response.status} ${text}`);
  }

  const json = await response.json();

  if (!json?.success || !json?.data?.url) {
    throw new Error('ImgBB upload succeeded but returned no image URL.');
  }

  return String(json.data.url);
}
