import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Customer } from "@/lib/mock-server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Gift, CreditCard, UserPlus, Search, RefreshCw, QrCode, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [qrCustomer, setQrCustomer] = useState<Customer | null>(null);

  // Queries
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: api.getCustomers,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: api.getTransactions,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: api.getEvents,
    refetchInterval: 2000, // Auto-refresh logs
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: api.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "Success", description: "Customer added successfully" });
      (document.getElementById("add-customer-form") as HTMLFormElement)?.reset();
    },
  });

  const earnPointsMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => api.earnPoints(id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Points Added", description: `Added ${data.points} points` });
      (document.getElementById("earn-form") as HTMLFormElement)?.reset();
    },
  });

  const redeemPointsMutation = useMutation({
    mutationFn: ({ id, points }: { id: string; points: number }) => api.redeemPoints(id, points),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Redeemed", description: `Redeemed ${data.points} points` });
      (document.getElementById("redeem-form") as HTMLFormElement)?.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    createCustomerMutation.mutate({
      name: formData.get("name") as string,
      whatsapp: formData.get("whatsapp") as string,
      birthday: formData.get("birthday") as string,
    });
  };

  const handleEarn = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (!selectedCustomerId) {
      toast({ title: "Select Customer", description: "Please select a customer first", variant: "destructive" });
      return;
    }
    earnPointsMutation.mutate({
      id: selectedCustomerId,
      amount: Number(formData.get("amount")),
    });
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (!selectedCustomerId) {
      toast({ title: "Select Customer", description: "Please select a customer first", variant: "destructive" });
      return;
    }
    redeemPointsMutation.mutate({
      id: selectedCustomerId,
      points: Number(formData.get("points")),
    });
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-[#F7F3EC] p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-pointy flex items-center justify-center shadow-sm">
            <span className="font-bold text-white text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pointy</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-sm text-gray-500 hidden md:block">Vendor Dashboard</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customers (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Add Customer Card */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="w-5 h-5 text-purple-500" />
                New Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form id="add-customer-form" onSubmit={handleAddCustomer} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs text-gray-500 uppercase font-medium">Name</Label>
                  <Input id="name" name="name" placeholder="Jane Doe" required className="bg-gray-50 border-gray-200" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="whatsapp" className="text-xs text-gray-500 uppercase font-medium">WhatsApp</Label>
                  <Input id="whatsapp" name="whatsapp" placeholder="+1234567890" required className="bg-gray-50 border-gray-200" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="birthday" className="text-xs text-gray-500 uppercase font-medium">Birthday (Optional)</Label>
                  <Input id="birthday" name="birthday" type="date" className="bg-gray-50 border-gray-200" />
                </div>
                <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card className="border-none shadow-sm flex flex-col h-[500px]">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg">Customers</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Search customers..." className="pl-9 bg-gray-50 border-none" />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center group ${selectedCustomerId === customer.id ? "bg-purple-50 border-l-4 border-purple-500" : ""}`}
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.whatsapp}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {customer.balance} pts
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrCustomer(customer);
                          }}
                        >
                          <QrCode className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  {customers.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">No customers yet.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Stats (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Points Issued</p>
                <p className="text-3xl font-bold text-green-600">{stats?.totalPointsIssued || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Points Redeemed</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.totalPointsRedeemed || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Card */}
            <Card className="border-none shadow-md md:col-span-2 bg-white overflow-hidden">
              <div className="h-2 bg-gradient-pointy w-full"></div>
              <CardHeader>
                <CardTitle>Manage Points</CardTitle>
                <CardDescription>
                  {selectedCustomer 
                    ? `Selected: ${selectedCustomer.name} (${selectedCustomer.balance} pts)` 
                    : "Select a customer from the list to start"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="earn" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="earn">Add Points (Earn)</TabsTrigger>
                    <TabsTrigger value="redeem">Redeem Reward</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="earn">
                    <form id="earn-form" onSubmit={handleEarn} className="space-y-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="amount">Purchase Amount ($)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <Input id="amount" name="amount" type="number" min="1" step="0.01" placeholder="0.00" className="pl-7 text-lg" required />
                          </div>
                        </div>
                        <Button type="submit" className="h-10 px-8 bg-green-600 hover:bg-green-700 text-white" disabled={!selectedCustomerId || earnPointsMutation.isPending}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Points
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Rate: 5% (5 points per $100). Customer will receive a WhatsApp notification.
                      </p>
                    </form>
                  </TabsContent>

                  <TabsContent value="redeem">
                    <form id="redeem-form" onSubmit={handleRedeem} className="space-y-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="points">Points to Redeem</Label>
                          <Input id="points" name="points" type="number" min="1" placeholder="0" className="text-lg" required />
                        </div>
                        <Button type="submit" variant="destructive" className="h-10 px-8" disabled={!selectedCustomerId || redeemPointsMutation.isPending}>
                          <Gift className="w-4 h-4 mr-2" />
                          Redeem
                        </Button>
                      </div>
                      {selectedCustomer && (
                        <p className="text-xs text-muted-foreground">
                          Max redeemable: {selectedCustomer.balance} points
                        </p>
                      )}
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'EARN' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {t.type === 'EARN' ? <Plus className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{t.customerName}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(t.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.type === 'EARN' ? 'text-green-600' : 'text-orange-600'}`}>
                          {t.type === 'EARN' ? '+' : '-'}{t.points}
                        </p>
                        {t.amount && <p className="text-xs text-gray-400">${t.amount}</p>}
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">No transactions yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

             {/* WhatsApp Log Simulation */}
             <Card className="border-none shadow-sm bg-gray-900 text-gray-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                  WhatsApp Simulation Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {events.map((e) => (
                      <div key={e.id} className="text-xs font-mono border-l-2 border-green-500 pl-3 py-1">
                        <p className="text-gray-500 mb-1">{format(new Date(e.createdAt), "HH:mm:ss")}</p>
                        <p className="text-green-300 leading-relaxed">{e.message}</p>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <p className="text-center text-gray-600 text-xs py-4">No messages sent yet.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrCustomer} onOpenChange={(open) => !open && setQrCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer QR Code</DialogTitle>
            <DialogDescription>Scan this code to identify the customer.</DialogDescription>
          </DialogHeader>
          {qrCustomer && (
            <div className="flex flex-col items-center justify-center p-4 space-y-4">
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrCustomer.id}`} 
                  alt={`QR code for ${qrCustomer.name}`} 
                  className="w-48 h-48"
                />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{qrCustomer.name}</p>
                <p className="text-sm text-gray-500">{qrCustomer.whatsapp}</p>
                <p className="text-xs text-gray-400 mt-1">ID: {qrCustomer.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
