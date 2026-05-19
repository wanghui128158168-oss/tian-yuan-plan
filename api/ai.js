export default async function handler(req, res) {
  // 允许所有来源（前端和后端同域，不需要严格 CORS 限制）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { systemPrompt, userMessage, feature } = req.body || {}

  const allowedFeatures = ['decompose', 'coach', 'onboarding', 'weekly']
  if (!feature || !allowedFeatures.includes(feature)) {
    return res.status(400).json({ error: 'Invalid feature' })
  }

  if (!systemPrompt || !userMessage) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (systemPrompt.length > 4000 || userMessage.length > 2000) {
    return res.status(400).json({ error: 'Input too long' })
  }

  const apiKey = process.env.MIMO_API_KEY
  if (!apiKey) {
    console.error('MIMO_API_KEY not configured')
    return res.status(500).json({ error: 'AI 服务未配置' })
  }

  try {
    const response = await fetch(
      'https://token-plan-cn.xiaomimimo.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mimo-v2.5-pro',
          thinking: { type: 'disabled' },
          max_completion_tokens: 800,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('MiMo API error:', response.status, errText)
      return res.status(502).json({ error: 'AI 服务暂时不可用，请稍后再试' })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return res.status(500).json({ error: '未获取到有效响应' })
    }

    return res.status(200).json({ content })

  } catch (error) {
    console.error('Handler error:', error.message)
    return res.status(500).json({ error: '服务异常，请稍后再试' })
  }
}
