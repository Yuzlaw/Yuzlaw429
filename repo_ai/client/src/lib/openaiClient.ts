export type OpenAISettings = {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutSec: number;
};

export function loadOpenAISettings(): OpenAISettings | null {
  const apiKey = localStorage.getItem("openaiApiKey")?.trim() || "";
  if (!apiKey) return null;

  const baseUrl = (localStorage.getItem("openaiBaseUrl")?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = localStorage.getItem("openaiModel")?.trim() || "gpt-4o-mini";

  const maxTokens = Number(localStorage.getItem("openaiMaxTokens") || "800");
  const temperature = Number(localStorage.getItem("openaiTemperature") || "0.3");
  const timeoutSec = Number(localStorage.getItem("openaiTimeoutSec") || "20");

  return {
    apiKey,
    baseUrl,
    model,
    maxTokens: Number.isFinite(maxTokens) ? maxTokens : 800,
    temperature: Number.isFinite(temperature) ? temperature : 0.3,
    timeoutSec: Number.isFinite(timeoutSec) ? timeoutSec : 20,
  };
}

async function postJsonWithTimeout(url: string, body: unknown, headers: Record<string, string>, timeoutSec: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), Math.max(1, timeoutSec) * 1000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API 錯誤（${res.status}）：${text || res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function summarizeZhTW(text: string) {
  const s = loadOpenAISettings();
  if (!s) throw new Error("尚未設定 OpenAI API 金鑰");

  const prompt =
    "請用繁體中文為下列內容做重點摘要。\n" +
    "- 條列 3～7 點\n" +
    "- 保留關鍵資訊（人、事、時、地、金額、條件）\n" +
    "- 不要編造不存在的內容\n\n" +
    "內容：\n" + text;

  const url = `${s.baseUrl}/chat/completions`;
  const data = await postJsonWithTimeout(
    url,
    {
      model: s.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: s.maxTokens,
      temperature: s.temperature,
    },
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.apiKey}`,
    },
    s.timeoutSec
  );

  return (data?.choices?.[0]?.message?.content || "").trim();
}

export async function polishZhTW(text: string) {
  const s = loadOpenAISettings();
  if (!s) throw new Error("尚未設定 OpenAI API 金鑰");

  const prompt =
    "請用繁體中文潤飾下列文字，使語句更通順、白話、專業，但不改變原意。\n" +
    "- 不要新增原文沒有的事實\n" +
    "- 必要時分段、加上小標題\n\n" +
    "內容：\n" + text;

  const url = `${s.baseUrl}/chat/completions`;
  const data = await postJsonWithTimeout(
    url,
    {
      model: s.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: s.maxTokens,
      temperature: s.temperature,
    },
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.apiKey}`,
    },
    s.timeoutSec
  );

  return (data?.choices?.[0]?.message?.content || "").trim();
}


export async function summarizeAndPolishZhTW(text: string) {
  const s = loadOpenAISettings();
  if (!s) throw new Error("尚未設定 OpenAI API 金鑰");

  const prompt =
    "請用繁體中文對下列內容做「摘要＋潤飾」並用同一份輸出交付。"
" +
    "要求：
" +
    "1) 先輸出「【摘要】」：條列 3～7 點，保留人事時地金額條件，不要編造。
" +
    "2) 再輸出「【潤飾後全文】」：讓語句更通順、白話、專業，但不改變原意，不新增原文沒有的事實。
" +
    "3) 最後加一行「【原文備份提示】如需復原請按🔙」

" +
    "內容：
" + text;

  const url = `${s.baseUrl}/chat/completions`;
  const data = await postJsonWithTimeout(
    url,
    {
      model: s.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: s.maxTokens,
      temperature: s.temperature,
    },
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.apiKey}`,
    },
    s.timeoutSec
  );

  return (data?.choices?.[0]?.message?.content || "").trim();
}
