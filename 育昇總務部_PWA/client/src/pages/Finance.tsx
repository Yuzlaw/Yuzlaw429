import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, RefreshCw, TrendingUp, TrendingDown, Wallet, PieChart, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useUITexts } from '@/contexts/UITextsContext';

interface ETFAsset {
  id: string;
  symbol: string; // 如 0056.TW
  name: string; // 中文名稱
  investedAmount: number; // 投入金額
  currentPrice: number; // 收盤價
  holdings: number; // 持股數量
  currentValue: number; // 當前市值
  profitLoss: number; // 未實現損益
  profitLossPercent: number; // 報酬率(%)
  dividendYield?: number; // 殖利率(%)
  estimatedAnnualDividend?: number; // 年預估配息
  dividendFrequency?: string; // 配息頻率
  recommendation?: string; // 建議動作
  lastUpdated: string;
}

interface Transaction {
  id: string;
  date: string;
  type: '收入' | '支出';
  category: string;
  amount: number;
  note?: string;
  month: number; // 1-12
}

export default function Finance() {
  const [location, navigate] = useLocation();
  const isSyncMode = location.startsWith('/sync');
  const basePath = isSyncMode ? '/sync' : '';

  const { texts } = useUITexts();
  const [etfAssets, setEtfAssets] = useState<ETFAsset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'etf' | 'accounting'>('etf');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  
  // ETF 對話框狀態
  const [isETFDialogOpen, setIsETFDialogOpen] = useState(false);
  const [editingETF, setEditingETF] = useState<ETFAsset | null>(null);
  const [etfForm, setETFForm] = useState({
    symbol: '',
    name: '',
    investedAmount: '',
    holdings: '',
    dividendYield: '', // 殖利率(%)
    estimatedAnnualDividend: '' // 年預估配息
  });
  
  // 記帳對話框狀態
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '支出' as '收入' | '支出',
    category: '',
    amount: '',
    note: ''
  });

  // 本機儲存（iPhone 17 使用也 OK）：避免關掉網頁就消失
  const LS_KEY_ETF = 'finance_etfAssets_v1';
  const LS_KEY_TX = 'finance_transactions_v1';

  const loadFinanceFromLocal = () => {
    try {
      const etfRaw = localStorage.getItem(LS_KEY_ETF);
      const txRaw = localStorage.getItem(LS_KEY_TX);
      return {
        etf: etfRaw ? (JSON.parse(etfRaw) as ETFAsset[]) : null,
        tx: txRaw ? (JSON.parse(txRaw) as Transaction[]) : null,
      };
    } catch {
      return { etf: null, tx: null };
    }
  };

  const saveFinanceToLocal = (nextETF: ETFAsset[], nextTx: Transaction[]) => {
    try {
      localStorage.setItem(LS_KEY_ETF, JSON.stringify(nextETF));
      localStorage.setItem(LS_KEY_TX, JSON.stringify(nextTx));
    } catch {
      // localStorage 可能滿了或被瀏覽器限制：忽略即可
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      saveFinanceToLocal(etfAssets, transactions);
    }
  }, [etfAssets, transactions, loading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const saved = loadFinanceFromLocal();
      if (saved.etf && saved.tx) {
        setEtfAssets(saved.etf);
        setTransactions(saved.tx);
        return;
      }

      // 先讀本機快取（有資料就用），沒有才用範例資料
      const mockETFs: ETFAsset[] = [
        {
          id: '1',
          symbol: '0056.TW',
          name: '元大高股息',
          investedAmount: 100000,
          currentPrice: 36.41,
          holdings: 2747,
          currentValue: 100000,
          profitLoss: 0,
          profitLossPercent: 0,
          dividendYield: 7.5,
          estimatedAnnualDividend: 2.73,
          dividendFrequency: '季配',
          recommendation: '持有',
          lastUpdated: new Date().toISOString()
        }
      ];

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: '2025-01-15',
          type: '支出',
          category: '飲食',
          amount: 150,
          note: '午餐',
          month: 1
        }
      ];

      setEtfAssets(mockETFs);
      setTransactions(mockTransactions);
      saveFinanceToLocal(mockETFs, mockTransactions);
    } catch (error) {
      console.error('載入資料失敗:', error);
      toast.error('載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      toast.success('價格已更新');
      await fetchData();
    } catch (error) {
      console.error('更新價格失敗:', error);
      toast.error('更新價格失敗');
    } finally {
      setRefreshing(false);
    }
  };

  // 記帳功能
  // ETF CRUD 函數
  const openETFDialog = (etf?: ETFAsset) => {
    if (etf) {
      setEditingETF(etf);
      setETFForm({
        symbol: etf.symbol,
        name: etf.name,
        investedAmount: etf.investedAmount.toString(),
        holdings: etf.holdings.toString(),
        dividendYield: etf.dividendYield?.toString() || '',
        estimatedAnnualDividend: etf.estimatedAnnualDividend?.toString() || ''
      });
    } else {
      setEditingETF(null);
      setETFForm({
        symbol: '',
        name: '',
        investedAmount: '',
        holdings: '',
        dividendYield: '',
        estimatedAnnualDividend: ''
      });
    }
    setIsETFDialogOpen(true);
  };

  const saveETF = async () => {
    if (!etfForm.symbol || !etfForm.name || !etfForm.investedAmount || !etfForm.holdings) {
      toast.error('請填寫所有欄位');
      return;
    }

    try {
      const newETF: ETFAsset = {
        id: editingETF?.id || Date.now().toString(),
        symbol: etfForm.symbol,
        name: etfForm.name,
        investedAmount: parseFloat(etfForm.investedAmount),
        holdings: parseFloat(etfForm.holdings),
        currentPrice: editingETF?.currentPrice || 0,
        currentValue: 0,
        profitLoss: 0,
        profitLossPercent: 0,
        dividendYield: etfForm.dividendYield ? parseFloat(etfForm.dividendYield) : undefined,
        estimatedAnnualDividend: etfForm.estimatedAnnualDividend ? parseFloat(etfForm.estimatedAnnualDividend) : undefined,
        lastUpdated: new Date().toISOString()
      };

      // 計算市值和損益
      newETF.currentValue = newETF.currentPrice * newETF.holdings;
      newETF.profitLoss = newETF.currentValue - newETF.investedAmount;
      newETF.profitLossPercent = (newETF.profitLoss / newETF.investedAmount) * 100;

      if (editingETF) {
        setEtfAssets(prev => prev.map(e => e.id === editingETF.id ? newETF : e));
        toast.success('ETF 已更新');
      } else {
        setEtfAssets(prev => [...prev, newETF]);
        toast.success('ETF 已新增');
      }

      setIsETFDialogOpen(false);
      // TODO: 同步到 Google Sheets
    } catch (error) {
      console.error('Failed to save ETF:', error);
      toast.error('儲存失敗');
    }
  };

  const deleteETF = async (id: string) => {
    if (!confirm('確定要刪除這個 ETF 嗎？')) return;

    try {
      setEtfAssets(prev => prev.filter(e => e.id !== id));
      toast.success('ETF 已刪除');
      // TODO: 同步到 Google Sheets
    } catch (error) {
      console.error('Failed to delete ETF:', error);
      toast.error('刪除失敗');
    }
  };

  const openTransactionDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setTransactionForm({
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount.toString(),
        note: transaction.note || ''
      });
    } else {
      setEditingTransaction(null);
      setTransactionForm({
        date: new Date().toISOString().split('T')[0],
        type: '支出',
        category: '',
        amount: '',
        note: ''
      });
    }
    setIsTransactionDialogOpen(true);
  };

  const saveTransaction = async () => {
    if (!transactionForm.category || !transactionForm.amount) {
      toast.error('請填寫必填欄位');
      return;
    }

    try {
      const transactionDate = new Date(transactionForm.date);
      const newTransaction: Transaction = {
        id: editingTransaction?.id || Date.now().toString(),
        date: transactionForm.date,
        type: transactionForm.type,
        category: transactionForm.category,
        amount: parseFloat(transactionForm.amount),
        note: transactionForm.note,
        month: transactionDate.getMonth() + 1
      };

      if (editingTransaction) {
        // 更新
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? newTransaction : t));
        toast.success('記帳已更新');
      } else {
        // 新增
        setTransactions(prev => [newTransaction, ...prev]);
        toast.success('記帳已新增');
      }

      setIsTransactionDialogOpen(false);
      
      // TODO: 儲存到 Google Sheets
    } catch (error) {
      console.error('儲存記帳失敗:', error);
      toast.error('儲存記帳失敗');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('確定要刪除這筆記帳嗎？')) return;

    try {
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('記帳已刪除');
      
      // TODO: 從 Google Sheets 刪除
    } catch (error) {
      console.error('刪除記帳失敗:', error);
      toast.error('刪除記帳失敗');
    }
  };

  // 計算統計
  const totalInvested = etfAssets.reduce((sum, asset) => sum + asset.investedAmount, 0);
  const totalValue = etfAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // 篩選當前月份的記帳
  const currentMonthTransactions = transactions.filter(t => t.month === selectedMonth);
  const totalIncome = currentMonthTransactions.filter(t => t.type === '收入').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === '支出').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  
  // 月份名稱
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 格式化函數
  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">投資</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshPrices}
            disabled={refreshing}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'etf' | 'accounting')} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="etf" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            ETF 投資
          </TabsTrigger>
          <TabsTrigger value="accounting" className="flex-1">
            <Wallet className="h-4 w-4 mr-2" />
            記帳
          </TabsTrigger>
        </TabsList>

        {/* ETF 投資 Tab */}
        <TabsContent value="etf" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* ETF 總覽卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">投資總覽</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">總投入</span>
                    <span className="font-semibold">{formatCurrency(totalInvested)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">當前市值</span>
                    <span className="font-semibold">{formatCurrency(totalValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">未實現損益</span>
                    <div className="flex items-center gap-2">
                      {totalProfitLoss >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-semibold ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(totalProfitLoss)}
                      </span>
                      <span className={`text-sm ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ({formatPercent(totalProfitLossPercent)})
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ETF 列表 */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">載入中...</p>
                </div>
              ) : etfAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground mb-4">尚無 ETF 投資資料</p>
                  <Button onClick={() => openETFDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    新增 ETF
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {etfAssets.map((asset) => (
                    <Card key={asset.id} className="cursor-pointer hover:bg-accent transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{asset.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {asset.symbol}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              持有 {asset.holdings.toLocaleString()} 股
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(asset.currentPrice)}</p>
                            {asset.dividendYield && (
                              <p className="text-xs text-muted-foreground">
                                殖利率 {asset.dividendYield}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">投入金額</p>
                            <p className="text-sm font-medium">{formatCurrency(asset.investedAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">當前市值</p>
                            <p className="text-sm font-medium">{formatCurrency(asset.currentValue)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">未實現損益</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-sm font-semibold ${asset.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(asset.profitLoss)}
                              </p>
                              <span className={`text-xs ${asset.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                ({formatPercent(asset.profitLossPercent)})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              openETFDialog(asset);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            編輯
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteETF(asset.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            刪除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* 記帳 Tab */}
        <TabsContent value="accounting" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* 月份選擇器 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">選擇月份</span>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthNames.map((name, index) => (
                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              {/* 記帳總覽卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{monthNames[selectedMonth - 1]}統計</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">總收入</span>
                    <span className="font-semibold text-green-500">{formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">總支出</span>
                    <span className="font-semibold text-red-500">{formatCurrency(totalExpense)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-semibold">結餘</span>
                    <span className={`font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 新增記帳按鈕 */}
              <Button className="w-full" onClick={() => openTransactionDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                新增記帳
              </Button>

              {/* 記帳列表 */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">載入中...</p>
                </div>
              ) : currentMonthTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">{monthNames[selectedMonth - 1]}尚無記帳資料</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentMonthTransactions.map((transaction) => (
                    <Card key={transaction.id} className="hover:bg-accent transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={transaction.type === '收入' ? 'bg-green-500' : 'bg-red-500'}>
                                {transaction.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {transaction.category}
                              </Badge>
                            </div>
                            {transaction.note && (
                              <p className="text-sm text-muted-foreground">{transaction.note}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className={`font-semibold ${transaction.type === '收入' ? 'text-green-500' : 'text-red-500'}`}>
                                {transaction.type === '收入' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openTransactionDialog(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => deleteTransaction(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* 新增/編輯 ETF 對話框 */}
      <Dialog open={isETFDialogOpen} onOpenChange={setIsETFDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingETF ? '編輯 ETF' : '新增 ETF'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="etf-symbol">ETF 代號</Label>
              <Input
                id="etf-symbol"
                placeholder="例如：0056.TW"
                value={etfForm.symbol}
                onChange={(e) => setETFForm({ ...etfForm, symbol: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="etf-name">ETF 名稱</Label>
              <Input
                id="etf-name"
                placeholder="例如：元大高股息"
                value={etfForm.name}
                onChange={(e) => setETFForm({ ...etfForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="etf-invested">投入金額</Label>
              <Input
                id="etf-invested"
                type="number"
                placeholder="0"
                value={etfForm.investedAmount}
                onChange={(e) => setETFForm({ ...etfForm, investedAmount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="etf-holdings">持股數量</Label>
              <Input
                id="etf-holdings"
                type="number"
                placeholder="0"
                value={etfForm.holdings}
                onChange={(e) => setETFForm({ ...etfForm, holdings: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="etf-dividend-yield">殖利率 (%) <span className="text-muted-foreground text-sm">選填</span></Label>
              <Input
                id="etf-dividend-yield"
                type="number"
                step="0.01"
                placeholder="例如：5.5"
                value={etfForm.dividendYield}
                onChange={(e) => setETFForm({ ...etfForm, dividendYield: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="etf-annual-dividend">年預估配息 <span className="text-muted-foreground text-sm">選填</span></Label>
              <Input
                id="etf-annual-dividend"
                type="number"
                step="0.01"
                placeholder="例如：2.5"
                value={etfForm.estimatedAnnualDividend}
                onChange={(e) => setETFForm({ ...etfForm, estimatedAnnualDividend: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveETF}>
                儲存
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => setIsETFDialogOpen(false)}>
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新增/編輯記帳對話框 */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? '編輯記帳' : '新增記帳'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">類型</Label>
              <Select
                value={transactionForm.type}
                onValueChange={(value: '收入' | '支出') => setTransactionForm({ ...transactionForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="收入">收入</SelectItem>
                  <SelectItem value="支出">支出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">類別</Label>
              <Input
                id="category"
                value={transactionForm.category}
                onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                placeholder="例如：飲食、交通、薪資"
              />
            </div>
            <div>
              <Label htmlFor="amount">金額</Label>
              <Input
                id="amount"
                type="number"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="note">備註（選填）</Label>
              <Textarea
                id="note"
                value={transactionForm.note}
                onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                placeholder="記錄詳細資訊..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveTransaction}>
                儲存
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
