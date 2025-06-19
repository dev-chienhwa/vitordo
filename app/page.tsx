'use client'
import { useState } from 'react'

export default function Home() {
  const [resume, setResume] = useState('')
  const [role, setRole] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const rewrite = async () => {
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, role }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data.text)
      } else {
        setResult(data.error || 'Something went wrong')
      }
    } catch (err) {
      setResult('Request failed')
    }
    setLoading(false)
  }

  const copy = () => navigator.clipboard.writeText(result)

  const download = () => {
    const el = document.createElement('a')
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(result))
    el.setAttribute('download', 'resume.txt')
    document.body.appendChild(el)
    el.click()
    document.body.removeChild(el)
  }

  return (
    <main className="min-h-screen p-4 flex flex-col items-center gap-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Vitordo Resume Rewriter</h1>
      <textarea
        className="w-full h-40 p-2 border rounded"
        placeholder="Paste your current resume here"
        value={resume}
        onChange={e => setResume(e.target.value)}
      />
      <input
        className="w-full p-2 border rounded"
        placeholder="Target job role"
        value={role}
        onChange={e => setRole(e.target.value)}
      />
      <button
        onClick={rewrite}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Rewriting...' : 'Rewrite My Resume'}
      </button>
      {result && (
        <div className="w-full flex flex-col gap-2 mt-4">
          <pre className="whitespace-pre-wrap p-2 border rounded bg-gray-50 dark:bg-gray-800 text-sm">{result}</pre>
          <div className="flex gap-2">
            <button onClick={copy} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Copy</button>
            <button onClick={download} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Download</button>
          </div>
        </div>
      )}
    </main>
  )
}
