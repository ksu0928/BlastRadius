export async function handler(event) {
  const hasKey = !!process.env.HYDRA_DB_API_KEY;
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      status: hasKey ? "ok" : "missing_api_key",
      database: "blastradius",
      timestamp: new Date().toISOString(),
    }),
  };
}
