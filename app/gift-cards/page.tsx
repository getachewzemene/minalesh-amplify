'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Container } from '@/components/ui/container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GiftCardPurchaseForm } from '@/components/user/GiftCardPurchaseForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Gift, CreditCard, History, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function GiftCardsPage() {
  const [balanceCode, setBalanceCode] = useState('')
  const [balanceData, setBalanceData] = useState<any>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const checkBalance = async () => {
    if (!balanceCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a gift card code',
        variant: 'destructive',
      })
      return
    }

    setLoadingBalance(true)
    try {
      const response = await fetch(`/api/gift-cards/balance?code=${encodeURIComponent(balanceCode.toUpperCase())}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to check balance')
      }

      const data = await response.json()
      setBalanceData(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check balance',
        variant: 'destructive',
      })
    } finally {
      setLoadingBalance(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Container className="flex-1 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Gift Cards</h1>
            <p className="text-muted-foreground">
              Purchase gift cards for yourself or others, check balances, and manage your gift cards
            </p>
          </div>

          <Tabs defaultValue="purchase" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchase">
                <Gift className="h-4 w-4 mr-2" />
                Purchase Gift Card
              </TabsTrigger>
              <TabsTrigger value="balance">
                <CreditCard className="h-4 w-4 mr-2" />
                Check Balance
              </TabsTrigger>
            </TabsList>

            {/* Purchase Tab */}
            <TabsContent value="purchase">
              <GiftCardPurchaseForm 
                onSuccess={(card) => {
                  toast({
                    title: 'Success!',
                    description: 'Your gift card has been purchased successfully',
                  })
                }}
              />
            </TabsContent>

            {/* Balance Check Tab */}
            <TabsContent value="balance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Check Gift Card Balance
                  </CardTitle>
                  <CardDescription>
                    Enter your gift card code to view balance and transaction history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="balance-code">Gift Card Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="balance-code"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        value={balanceCode}
                        onChange={(e) => setBalanceCode(e.target.value.toUpperCase())}
                        className="font-mono"
                        maxLength={19}
                      />
                      <Button onClick={checkBalance} disabled={loadingBalance}>
                        {loadingBalance ? 'Checking...' : 'Check Balance'}
                      </Button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  {balanceData && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                              <p className="text-3xl font-bold text-green-600">
                                {balanceData.balance} ETB
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Original Amount</p>
                              <p className="text-2xl font-semibold">
                                {balanceData.originalAmount} ETB
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Status</p>
                              <Badge 
                                variant={balanceData.isExpired ? 'destructive' : 'default'}
                                className="text-sm"
                              >
                                {balanceData.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expires on:</span>
                          <span className="font-medium">
                            {new Date(balanceData.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                        {balanceData.recipientEmail && (
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-muted-foreground">Recipient:</span>
                            <span className="font-medium">{balanceData.recipientEmail}</span>
                          </div>
                        )}
                      </div>

                      {/* Transaction History */}
                      {balanceData.transactions && balanceData.transactions.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            <h3 className="font-semibold">Recent Transactions</h3>
                          </div>
                          <div className="space-y-2">
                            {balanceData.transactions.map((transaction: any) => (
                              <div
                                key={transaction.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium capitalize">{transaction.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(transaction.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <p className={`font-semibold ${
                                  transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'purchase' ? '+' : '-'}
                                  {transaction.amount} ETB
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How Gift Cards Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Purchasing
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Choose from preset amounts or enter a custom amount</li>
                    <li>• Send directly to a recipient via email</li>
                    <li>• Add a personal message</li>
                    <li>• Valid for 1 year from purchase date</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Redeeming
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use at checkout to apply to your order</li>
                    <li>• Partial redemption supported</li>
                    <li>• Remaining balance saved for future use</li>
                    <li>• Check your balance anytime</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
      <Footer />
    </div>
  )
}
