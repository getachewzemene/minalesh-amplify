'use client'

import { useState, useEffect } from "react"
import { MessageCircle, ThumbsUp, Send, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Question {
  id: string
  question: string
  answer?: string
  userName: string
  createdAt: string
  answeredAt?: string
  helpfulCount: number
  isHelpful?: boolean
}

interface ProductQAProps {
  productId: string
}

export function ProductQA({ productId }: ProductQAProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchQuestions()
  }, [productId])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuestion = async () => {
    if (!user) {
      toast.error("Please login to ask a question")
      return
    }

    if (!newQuestion.trim()) {
      toast.error("Please enter a question")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion })
      })

      if (response.ok) {
        toast.success("Question submitted successfully!")
        setNewQuestion("")
        fetchQuestions()
      } else {
        toast.error("Failed to submit question")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkHelpful = async (questionId: string) => {
    if (!user) {
      toast.error("Please login to mark as helpful")
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}/questions/${questionId}/helpful`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchQuestions()
      }
    } catch (error) {
      console.error('Error marking helpful:', error)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Customer Questions & Answers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ask Question Form */}
        <div className="space-y-3">
          <h3 className="font-semibold">Have a question about this product?</h3>
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask a question that other customers might find helpful..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
              className="flex-1"
              disabled={!user}
            />
          </div>
          <Button 
            onClick={handleSubmitQuestion}
            disabled={!user || submitting || !newQuestion.trim()}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {user ? 'Submit Question' : 'Login to Ask'}
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-4 pt-4 border-t">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading questions...</p>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                {/* Question */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">Q: {q.question}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Asked by {q.userName} • {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Answer */}
                {q.answer && (
                  <div className="ml-11 pl-4 border-l-2 border-primary/20">
                    <p className="text-sm mb-1"><strong>A:</strong> {q.answer}</p>
                    {q.answeredAt && (
                      <p className="text-xs text-muted-foreground">
                        Answered {formatDistanceToNow(new Date(q.answeredAt), { addSuffix: true })}
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 gap-1"
                      onClick={() => handleMarkHelpful(q.id)}
                    >
                      <ThumbsUp className={`w-3 h-3 ${q.isHelpful ? 'fill-current' : ''}`} />
                      <span className="text-xs">
                        Helpful {q.helpfulCount > 0 && `(${q.helpfulCount})`}
                      </span>
                    </Button>
                  </div>
                )}

                {!q.answer && (
                  <p className="ml-11 text-sm text-muted-foreground italic">
                    Waiting for answer from seller...
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
