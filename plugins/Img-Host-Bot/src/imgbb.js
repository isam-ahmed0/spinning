'use strict';

const IMGBB_UPLOAD_ENDPOINT = 'https://api.imgbb.com/1/upload';

async function uploadImage({ apiKey, base64, name, expiration }) {
  const body = new URLSearchParams();
  body.append('key', apiKey);
  body.append('image', base64);
  if (name) body.append('name', name);
  if (expiration) body.append('expiration', String(expiration));

  const response = await fetch(IMGBB_UPLOAD_ENDPOINT, {
    method: 'POST',
    body,
  });

  let json;
  try {
    json = await response.json();
  } catch (err) {
    const e = new Error(`imgbb returned non-JSON (HTTP ${response.status})`);
    e.status = response.status;
    throw e;
  }

  if (!response.ok || json?.success === false) {
    const message =
      json?.error?.message ||
      json?.status_txt ||
      `imgbb upload failed (HTTP ${response.status})`;
    const err = new Error(message);
    err.status = json?.status ?? response.status;
    err.payload = json;
    throw err;
  }

  return json.data;
}

async function fetchAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString('base64');
}

module.exports = { uploadImage, fetchAsBase64 };
