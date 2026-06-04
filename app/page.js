'use client'

import { useState, useRef } from 'react'

function compressImage(dataUrl, maxSize) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width, h = img.height
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = (h * maxSize) / w; w = maxSize }
        else { w = (w * maxSize) / h; h = maxSize }
      }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = dataUrl
  })
}

export default function Home() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef()

  const addPhotos = (files) => {
    const toAdd = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 5 - photos.length)
    toAdd.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPhotos((prev) => {
          if (prev.length >= 5) return prev
          return [...prev, { id: Date.now() + Math.random(), dataUrl: ev.target.result, file }]
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
    setResults(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    addPhotos(e.dataTransfer.files)
  }

  const analyze = async () => {
    if (photos.length < 2) return
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const shuffled = [...photos].map((p, i) => ({ ...p, origIndex: i }))
        .sort(() => Math.random() - 0.5)

      const images = await Promise.all(shuffled.map(async (p) => {
        const compressed = await compressImage(p.dataUrl, 800)
        return {
          mediaType: 'image/jpeg',
          data: compressed.split(',')[1],
        }
      }))

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, count: photos.length, order: shuffled.map(p => p.origIndex) }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data)
    } catch (err) {
      setError('분석 중 오류가 났어. 다시 시도해봐! (' + err.message + ')')
    } finally {
      setLoading(false)
    }
  }

  const sorted = results ? [...results.photos].sort((a, b) => b.score - a.score) : []

  return (
    <div className="container">
      <h1>소개팅 프로필 사진 고르기 🌶️</h1>
      <p className="subtitle">핫걸 여사친이 스파이시하게 골라줌</p>

      <div
        className="upload-zone"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ opacity: photos.length >= 5 ? 0.4 : 1 }}
      >
        <div className="icon">📸</div>
        <p>사진 클릭해서 올리기</p>
        <span>JPG, PNG, WEBP · 최대 5장</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => addPhotos(e.target.files)}
      />

      {photos.length > 0 && (
        <div className="photos-grid">
          {photos.map((p, i) => (
            <div key={p.id} className="photo-item">
              <img src={p.dataUrl} alt={`사진 ${i + 1}`} />
              <span className="photo-num">{i + 1}</span>
              <button className="photo-remove" onClick={() => removePhoto(p.id)} aria-label="삭제">✕</button>
            </div>
          ))}
        </div>
      )}

      <button className="analyze-btn" disabled={photos.length < 2 || loading} onClick={analyze}>
        {loading ? '분석 중...' : '🌶️ 여사친한테 물어보기'}
      </button>

      {error && <p className="error-msg">{error}</p>}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>여사친이 스파이시하게 보는 중... 🌶️</p>
        </div>
      )}

      {results && (
        <div className="results">
          <div className="summary-box">
            <strong>총평 &nbsp;</strong>{results.summary}
          </div>
          {sorted.map((p) => {
            const photo = photos[p.num - 1]
            const scoreClass = p.score >= 7.5 ? '' : p.score >= 5.5 ? 'mid' : 'low'
            return (
              <div key={p.num} className={`result-card ${p.isBest ? 'winner' : ''}`}>
                <div className="result-header">
                  {photo && <img className="result-thumb" src={photo.dataUrl} alt={`사진 ${p.num}`} />}
                  <div className="result-meta">
                    <div className="result-title">
                      사진 {p.num}
                      {p.isBest && <span className="badge-best">베스트</span>}
                    </div>
                    <div className="score-bar-wrap">
                      <div className="score-bar-bg">
                        <div className={`score-bar-fill ${scoreClass}`} style={{ width: `${Math.round(p.score * 10)}%` }} />
                      </div>
                      <span className="score-num">{p.score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="result-body">
                  <div>{p.comment}</div>
                  <div className="result-tags">
                    {(p.good || []).map((g, i) => <span key={i} className="tag good">✓ {g}</span>)}
                    {(p.bad || []).map((b, i) => <span key={i} className="tag bad">△ {b}</span>)}
                  </div>
                  {p.isBest && <div className="best-reason">🌶️ {results.bestReason}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="footer">powered by Claude AI</p>
    </div>
  )
}
