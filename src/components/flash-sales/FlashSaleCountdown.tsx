'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  targetDate: Date | string
  onExpire?: () => void
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function FlashSaleCountdown({ targetDate, onExpire, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime()
      const now = new Date().getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        })
        if (onExpire) {
          onExpire()
        }
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onExpire])

  if (timeLeft.total <= 0) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-red-600 font-semibold">Sale Ended</p>
      </div>
    )
  }

  return (
    <div className={`flex gap-1 sm:gap-2 justify-center items-center ${className}`}>
      {timeLeft.days > 0 && (
        <div className="flex flex-col items-center bg-red-600 text-white rounded-lg p-1.5 sm:p-2 min-w-[50px] sm:min-w-[60px]">
          <span className="text-xl sm:text-2xl font-bold">{timeLeft.days}</span>
          <span className="text-xs uppercase">Days</span>
        </div>
      )}
      <div className="flex flex-col items-center bg-red-600 text-white rounded-lg p-1.5 sm:p-2 min-w-[50px] sm:min-w-[60px]">
        <span className="text-xl sm:text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-xs uppercase">Hours</span>
      </div>
      <div className="flex flex-col items-center bg-red-600 text-white rounded-lg p-1.5 sm:p-2 min-w-[50px] sm:min-w-[60px]">
        <span className="text-xl sm:text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-xs uppercase">Mins</span>
      </div>
      <div className="flex flex-col items-center bg-red-600 text-white rounded-lg p-1.5 sm:p-2 min-w-[50px] sm:min-w-[60px]">
        <span className="text-xl sm:text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-xs uppercase">Secs</span>
      </div>
    </div>
  )
}
