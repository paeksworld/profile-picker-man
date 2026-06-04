export async function POST(req) {
  try {
    const { images, count } = await req.json()
    const mode = 'male'

    if (!images || images.length < 2) {
      return Response.json({ error: '사진을 2장 이상 올려줘' }, { status: 400 })
    }

    const imageBlocks = images.map((img) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.data,
      },
    }))

    const prompt = `너는 지금 핫하고 솔직한 여사친 역할이야. 남자 친구가 소개팅 프로필 사진 ${count}장을 보내면서 어떤 게 제일 나은지 물어봤어.

여자 입장에서 스파이시하고 솔직하게 말해줘. 잘생긴 건 잘생겼다고, 별로면 뭘 고쳐야 하는지 직접적으로 말해줘. 패션, 표정, 분위기 다 봐줘. 친구한테 말하듯이 편하게.

각 사진에 대해 아래 JSON 형식으로만 답해줘. 다른 말 없이 JSON만:

{
  "summary": "사진들을 전체적으로 봤을 때의 총평 (2-3문장). 특정 사진 번호는 절대 언급하지 말고, 전반적인 인상과 공통적인 피드백만 말할 것",
  "photos": [
    {
      "num": 1,
      "score": 8.5,
      "comment": "솔직한 코멘트 2-3문장",
      "good": ["좋은 점1", "좋은 점2"],
      "bad": ["아쉬운 점1"],
      "isBest": false
    }
  ],
  "bestNum": 2,
  "bestReason": "이 사진이 베스트인 이유 한 문장"
}

사진 번호는 1부터 ${count}까지. isBest는 베스트 사진만 true.

score는 아래 기준으로 채점해 (합산 10점):
- 표정/눈빛 자연스러움: 0-3점
- 전체적인 인상/분위기: 0-3점
- 배경/구도/조명: 0-2점
- 옷차림/스타일: 0-2점

각 사진을 위 기준으로 독립적으로 채점해. 매번 동일한 기준으로 일관되게 평가할 것.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: [...imageBlocks, { type: 'text', text: prompt }],
          },
        ],
      }),
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const text = data.content.map((b) => b.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return Response.json(parsed)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
