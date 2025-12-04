import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Customer, Settings } from "@/lib/mock-server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Gift, UserPlus, Search, RefreshCw, MessageSquare, Settings as SettingsIcon, LogOut, Store } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLocation } from "wouter";

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" },
  { code: "+52", country: "Mexico" },
  { code: "+54", country: "Argentina" },
  { code: "+55", country: "Brazil" },
  { code: "+56", country: "Chile" },
  { code: "+57", country: "Colombia" },
  { code: "+34", country: "Spain" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  
  // Form states for phone input
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");

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

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: api.createCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "Success", description: "Customer added successfully" });
      setIsAddCustomerOpen(false);
      // Auto select new customer
      setSelectedCustomerId(data.id);
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

  const updateSettingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings Updated", description: "Your changes have been saved." });
      setIsSettingsOpen(false);
    },
  });

  const addBranchMutation = useMutation({
    mutationFn: api.addBranch,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["settings"] });
        toast({ title: "Branch Added", description: "New branch created." });
        setNewBranchName("");
    }
  })

  // Handlers
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const phoneNumber = formData.get("phoneNumber") as string;
    const fullPhone = `${selectedCountryCode}${phoneNumber}`; // Combine code and number

    createCustomerMutation.mutate({
      name: formData.get("name") as string,
      whatsapp: fullPhone,
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

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    updateSettingsMutation.mutate({
      rate: Number(formData.get("rate")),
      franchise: formData.get("franchise") as string,
      password: formData.get("password") as string,
    });
  };
  
  const handleAddBranch = (e: React.FormEvent) => {
      e.preventDefault();
      if(newBranchName) {
          addBranchMutation.mutate(newBranchName);
      }
  }

  const handleLogout = () => {
    setLocation("/login");
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.whatsapp.includes(searchQuery)
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-[#F7F3EC] p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-pointy flex items-center justify-center shadow-sm">
            <span className="font-bold text-white text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PUNTIFY.CO</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-sm text-gray-500 hidden md:block mr-2">
             {settings?.franchise || "Main Store"}
           </div>
           
           <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
             <DialogTrigger asChild>
               <Button variant="outline" size="icon" className="rounded-full">
                 <SettingsIcon className="w-4 h-4" />
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-lg">
               <DialogHeader>
                 <DialogTitle>Vendor Settings</DialogTitle>
                 <DialogDescription>Manage your store configuration and branches.</DialogDescription>
               </DialogHeader>
               <div className="space-y-6 mt-4">
                 <form id="settings-form" onSubmit={handleUpdateSettings} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rate">Points Rate (Points per $1)</Label>
                        <Input id="rate" name="rate" type="number" step="0.01" defaultValue={settings?.rate} required />
                        <p className="text-xs text-muted-foreground">Current: {((settings?.rate || 0) * 100).toFixed(0)}% return</p>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="franchise">Active Branch</Label>
                        <Select name="franchise" defaultValue={settings?.franchise}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select franchise" />
                            </SelectTrigger>
                            <SelectContent>
                            {settings?.branches?.map((branch) => (
                                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Change Password</Label>
                        <Input id="password" name="password" type="password" placeholder="New password" />
                    </div>
                 </form>

                 <div className="border-t pt-4 space-y-4">
                     <Label>Add New Branch</Label>
                     <div className="flex gap-2">
                         <Input 
                            placeholder="Branch Name" 
                            value={newBranchName} 
                            onChange={(e) => setNewBranchName(e.target.value)}
                         />
                         <Button 
                            type="button" 
                            variant="secondary"
                            onClick={handleAddBranch}
                            disabled={!newBranchName || addBranchMutation.isPending}
                         >
                             <Store className="w-4 h-4 mr-2" />
                             Add
                         </Button>
                     </div>
                 </div>
               </div>
               <DialogFooter className="mt-6">
                 <Button type="submit" form="settings-form" disabled={updateSettingsMutation.isPending}>Save Changes</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>

           <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={handleLogout}>
             <LogOut className="w-4 h-4" />
           </Button>
        </div>
      </header>

      {/* Stats Row - Moved to Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer List (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-sm flex flex-col h-[600px]">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Customers</CardTitle>
               <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCustomer} className="space-y-4 mt-2">
                        <div className="space-y-1">
                        <Label htmlFor="name" className="text-xs text-gray-500 uppercase font-medium">Name</Label>
                        <Input id="name" name="name" placeholder="Jane Doe" required className="bg-gray-50 border-gray-200" />
                        </div>
                        <div className="space-y-1">
                        <Label htmlFor="whatsapp" className="text-xs text-gray-500 uppercase font-medium">WhatsApp</Label>
                        <div className="flex gap-2">
                            <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                            <SelectTrigger className="w-[110px] bg-gray-50 border-gray-200">
                                <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRY_CODES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                    {c.code}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <Input id="phoneNumber" name="phoneNumber" placeholder="1234567890" required className="flex-1 bg-gray-50 border-gray-200" />
                        </div>
                        </div>
                        <div className="space-y-1">
                        <Label htmlFor="birthday" className="text-xs text-gray-500 uppercase font-medium">Birthday (Optional)</Label>
                        <Input id="birthday" name="birthday" type="date" className="bg-gray-50 border-gray-200" />
                        </div>
                        <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={createCustomerMutation.isPending}>
                        {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
                        </Button>
                    </form>
                  </DialogContent>
                </Dialog>
            </CardHeader>
            
            <div className="p-4 pb-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                        placeholder="Search by name or phone..." 
                        className="pl-9 bg-gray-50 border-gray-200" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <CardContent className="p-0 flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full">
                <div className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
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
                      </div>
                    </motion.div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">No customers found.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & History (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Action Card */}
          <Card className="border-none shadow-md bg-white overflow-hidden">
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
                      Rate: {((settings?.rate || 0) * 100).toFixed(0)}% ({((settings?.rate || 0) * 100).toFixed(0)} points per $100). Customer will receive a WhatsApp notification.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card className="border-none shadow-sm h-[400px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                    {transactions.map((t) => {
                        const customer = customers.find(c => c.id === t.customerId);
                        const message = `Hola ${t.customerName}, el ${format(new Date(t.createdAt), "dd/MM/yyyy 'a las' HH:mm")} se ${t.type === 'EARN' ? 'sumaron' : 'canjearon'} ${t.points} puntos. ${t.amount ? `Monto: $${t.amount}` : ''}`;
                        const whatsappUrl = customer ? `https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}` : '#';

                        return (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
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
                            <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className={`font-bold ${t.type === 'EARN' ? 'text-green-600' : 'text-orange-600'}`}>
                                {t.type === 'EARN' ? '+' : '-'}{t.points}
                                </p>
                                {t.amount && <p className="text-xs text-gray-400">${t.amount}</p>}
                            </div>
                            {customer && (
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                asChild
                                >
                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="Send WhatsApp Receipt">
                                    <MessageSquare className="w-4 h-4" />
                                </a>
                                </Button>
                            )}
                            </div>
                        </div>
                        );
                    })}
                    {transactions.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4">No transactions yet.</p>
                    )}
                    </div>
                </ScrollArea>
              </CardContent>
            </Card>

             {/* WhatsApp Log Simulation */}
             <Card className="border-none shadow-sm bg-gray-900 text-gray-300 h-[400px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                  WhatsApp Simulation Log
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
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
    </div>
  );
}
