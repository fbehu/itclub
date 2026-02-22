import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  groups: string[];
  monthlyPayment: number;
  totalPaid: number;
  debt: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onPayment: (amount: number) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  user,
  onPayment,
}: PaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handlePayment = () => {
    setError('');

    if (!amount || isNaN(Number(amount))) {
      setError('Iltimos, to\'g\'ri summa kiriting');
      return;
    }

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      setError('Summa 0 dan katta bo\'lishi kerak');
      return;
    }

    if (paymentAmount > 1000000) {
      setError('Summa juda katta (maksimum 1,000,000 so\'m)');
      return;
    }

    onPayment(paymentAmount);
    setAmount('');
  };

  const quickPaymentAmounts = [
    user.monthlyPayment, // 1 oy
    user.monthlyPayment * 1.5, // 1.5 oy
    user.monthlyPayment * 2, // 2 oy
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            To'lov Qabul Qilish
          </DialogTitle>
          <DialogDescription>
            O'quvchiga pul qo'shish
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {user.phone}
              </p>
            </div>
          </div>

          {/* Guruhlar */}
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Guruhlar:
            </p>
            <div className="flex flex-wrap gap-1">
              {user.groups.map((group, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {group}
                </Badge>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                To'lash Kerak
              </p>
              <p className="font-bold text-slate-900 dark:text-white">
                {(user.monthlyPayment / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                To'langan
              </p>
              <p className="font-bold text-green-600">
                {(user.totalPaid / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Qarzi
              </p>
              <p
                className={`font-bold ${
                  user.debt === 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {(user.debt / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
            To'lov Summası (so'm)
          </label>
          <Input
            type="number"
            placeholder="Masalan: 150000"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            className="text-base"
          />
          {error && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>

        {/* Quick Payment Buttons */}
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Tez to'lovlar:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {quickPaymentAmounts.map((quickAmount, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setAmount(quickAmount.toString());
                  setError('');
                }}
                className="text-xs"
              >
                {idx === 0 ? '1 oy' : idx === 1 ? '1.5 oy' : '2 oy'}
                <br />
                {(quickAmount / 1000).toFixed(0)}K
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Bekor Qilish
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!amount}
          >
            To'lovni Qabul Qilish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
