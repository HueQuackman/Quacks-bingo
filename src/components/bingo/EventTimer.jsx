import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, CheckCircle } from 'lucide-react';

export default function EventTimer({ startTime, endTime, status }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [timerLabel, setTimerLabel] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      let targetTime;
      if (now < start) {
        targetTime = start;
        setTimerLabel('Starts in');
      } else if (now < end) {
        targetTime = end;
        setTimerLabel('Ends in');
      } else {
        setTimerLabel('Event ended');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const diff = targetTime - now;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const TimeBlock = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/40 rounded-lg px-3 py-2 min-w-[50px] border border-[#3a3a3a]"
      >
        <span className="text-2xl font-bold text-[#ff981f]">
          {String(value).padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-xs text-[#a0a0a0] mt-1">{label}</span>
    </div>
  );

  const statusIcon = {
    upcoming: <Clock className="w-5 h-5 text-yellow-400" />,
    active: <Play className="w-5 h-5 text-green-400" />,
    completed: <CheckCircle className="w-5 h-5 text-blue-400" />
  };

  return (
    <div 
      className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] p-4 rounded-xl border-4 border-[#3a3a3a] shadow-2xl"
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        {statusIcon[status]}
        <span className="text-[#ff981f] font-bold">{timerLabel}</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <TimeBlock value={timeLeft.days} label="Days" />
        <span className="text-2xl text-[#ff981f] font-bold">:</span>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <span className="text-2xl text-[#ff981f] font-bold">:</span>
        <TimeBlock value={timeLeft.minutes} label="Mins" />
        <span className="text-2xl text-[#ff981f] font-bold">:</span>
        <TimeBlock value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
}