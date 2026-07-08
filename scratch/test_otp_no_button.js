const META_ACCESS_TOKEN = "EAAVjnkkrc1ABR0aIJMZC3BeypPWwlTBfhDXsPzkJx8ZB1BgxeJZBXT2gPEUIz1zKO6UD7lTzqtyg78vtpQnZBe1UQk6ahaOwNId6MhyNTZC9zXqsAATR0JKn62rXPwNoUD4WWjythZCkp4deKkTYS2NZA0ehn5xWMCIVZAEhl1Mq9DhHiy0noERNSbsp8OcrtZCAynJYAy2vaE0r4wXiBZCwk46ZCwW1jMWabORqjRgyNFaxZAM021YhF0cRWwLd6DOYgytJjBRjklIGZBl0jkxbSDU8x";
const META_PHONE_NUMBER_ID = "1242547802272575";
const RECIPIENT_PHONE = "918630027341"; // Admin number

async function testOtpNoButton() {
  const url = `https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`;
  
  // Try payload with BODY ONLY
  const payload = {
    messaging_product: "whatsapp",
    to: RECIPIENT_PHONE,
    type: "template",
    template: {
      name: "otp_verification",
      language: {
        code: "en"
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "123456"
            }
          ]
        }
      ]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("BODY-ONLY STATUS:", response.status);
    console.log("BODY-ONLY RESPONSE:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

testOtpNoButton();
