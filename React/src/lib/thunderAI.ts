import { getSession } from "../lib/auth";

export async function postMessageToThunderAI(message: string) {
  const thunderUrl = import.meta.env.VITE_THUNDERAI_URL;

  try {
    const response = await fetch(thunderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await getSession())?.access_token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to post message to ThunderAI: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }
  } catch (error) {
    console.error("Error posting message to ThunderAI:", error);
    throw error;
  }
}
