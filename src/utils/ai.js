export const callAI = async (systemPrompt, userMessage, feature) => {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userMessage, feature })
    })

    const data = await response.json().catch(() => ({ error: '响应解析失败' }))

    if (!response.ok) {
      throw new Error(data.error || `请求失败: ${response.status}`)
    }

    if (!data.content) {
      throw new Error('未获取到有效响应')
    }

    return data.content
  } catch (error) {
    throw new Error(error.message || 'AI 调用失败')
  }
}
