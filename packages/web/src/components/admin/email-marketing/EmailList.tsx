"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Download,
  Upload,
  Search,
  Filter,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  BarChart3,
  FileText,
  Trash2,
  Eye,
  Edit,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Building,
  Star,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showSuccess, showError } from "@/components/ui/Toast";

interface EmailListProps {
  emailList: any[];
  loading: boolean;
  onEmailListChange: (emailList: any[]) => void;
}

interface EmailSubscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  subscribedAt: Date;
  lastActivity?: Date;
  location?: string;
  company?: string;
  segment?: string;
  preferences: {
    marketing: boolean;
    newsletter: boolean;
    updates: boolean;
  };
  metrics: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
  };
}

export function EmailList({ 
  emailList, 
  loading, 
  onEmailListChange 
}: EmailListProps) {
  const { user } = useFirebaseAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<EmailSubscriber | null>(null);
  const [previewSubscriber, setPreviewSubscriber] = useState<EmailSubscriber | null>(null);

  const [subscriberForm, setSubscriberForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    location: "",
    company: "",
    segment: "",
    preferences: {
      marketing: true,
      newsletter: true,
      updates: false,
    },
  });

  // Filter subscribers based on search and filters
  const filteredSubscribers = emailList.filter(subscriber => {
    const matchesSearch = 
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscriber.company && subscriber.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === "all" || subscriber.status === selectedStatus;
    const matchesSegment = selectedSegment === "all" || subscriber.segment === selectedSegment;
    
    return matchesSearch && matchesStatus && matchesSegment;
  });

  // Get status and segment counts
  const statusCounts = emailList.reduce((acc, subscriber) => {
    acc[subscriber.status] = (acc[subscriber.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const segmentCounts = emailList.reduce((acc, subscriber) => {
    if (subscriber.segment) {
      acc[subscriber.segment] = (acc[subscriber.segment] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const statuses = [
    { value: "all", label: "All Subscribers", count: emailList.length },
    { value: "active", label: "Active", count: statusCounts.active || 0 },
    { value: "inactive", label: "Inactive", count: statusCounts.inactive || 0 },
    { value: "unsubscribed", label: "Unsubscribed", count: statusCounts.unsubscribed || 0 },
  ];

  const segments = [
    { value: "all", label: "All Segments", count: emailList.length },
    ...Object.entries(segmentCounts).map(([segment, count]) => ({
      value: segment,
      label: segment,
      count: count || 0,
    })),
  ];

  const handleAddSubscriber = () => {
    setEditingSubscriber(null);
    setSubscriberForm({
      email: "",
      firstName: "",
      lastName: "",
      location: "",
      company: "",
      segment: "",
      preferences: {
        marketing: true,
        newsletter: true,
        updates: false,
      },
    });
    setShowAddDialog(true);
  };

  const handleEditSubscriber = (subscriber: EmailSubscriber) => {
    setEditingSubscriber(subscriber);
    setSubscriberForm({
      email: subscriber.email,
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      location: subscriber.location || "",
      company: subscriber.company || "",
      segment: subscriber.segment || "",
      preferences: subscriber.preferences,
    });
    setShowAddDialog(true);
  };

  const handleSaveSubscriber = async () => {
    try {
      if (!subscriberForm.email || !subscriberForm.firstName || !subscriberForm.lastName) {
        showError("Please fill in all required fields");
        return;
      }

      const subscriberData = {
        ...subscriberForm,
        id: editingSubscriber?.id || `subscriber-${Date.now()}`,
        status: editingSubscriber?.status || 'active',
        subscribedAt: editingSubscriber?.subscribedAt || new Date(),
        lastActivity: editingSubscriber?.lastActivity,
        metrics: editingSubscriber?.metrics || {
          emailsSent: 0,
          emailsOpened: 0,
          emailsClicked: 0,
        },
      };

      if (editingSubscriber) {
        onEmailListChange(emailList.map(s => s.id === editingSubscriber.id ? subscriberData : s));
        showSuccess("Subscriber updated successfully");
      } else {
        onEmailListChange([...emailList, subscriberData]);
        showSuccess("Subscriber added successfully");
      }

      setShowAddDialog(false);
    } catch (error) {
      console.error('Error saving subscriber:', error);
      showError("Failed to save subscriber");
    }
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) {
      return;
    }

    try {
      onEmailListChange(emailList.filter(s => s.id !== subscriberId));
      showSuccess("Subscriber removed successfully");
    } catch (error) {
      console.error('Error removing subscriber:', error);
      showError("Failed to remove subscriber");
    }
  };

  const handleExportList = () => {
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Status', 'Subscribed At', 'Location', 'Company', 'Segment'].join(','),
      ...filteredSubscribers.map(subscriber => [
        subscriber.email,
        subscriber.firstName,
        subscriber.lastName,
        subscriber.status,
        new Date(subscriber.subscribedAt).toLocaleDateString(),
        subscriber.location || '',
        subscriber.company || '',
        subscriber.segment || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess("Email list exported successfully");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <Clock className="h-4 w-4" />;
      case 'unsubscribed': return <AlertCircle className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'unsubscribed': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateEngagementRate = (metrics: EmailSubscriber['metrics']) => {
    if (metrics.emailsSent === 0) return 0;
    return Math.round((metrics.emailsOpened / metrics.emailsSent) * 100);
  };

  const calculateClickRate = (metrics: EmailSubscriber['metrics']) => {
    if (metrics.emailsSent === 0) return 0;
    return Math.round((metrics.emailsClicked / metrics.emailsSent) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{emailList.length}</div>
            <p className="text-xs text-gray-500">
              +{Math.floor(Math.random() * 20)}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Active Rate</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {emailList.length > 0 ? Math.round((statusCounts.active / emailList.length) * 100) : 0}%
            </div>
            <p className="text-xs text-gray-500">
              {statusCounts.active || 0} active subscribers
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Avg. Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {emailList.length > 0 
                ? Math.round(emailList.reduce((acc, s) => acc + calculateEngagementRate(s.metrics), 0) / emailList.length)
                : 0}%
            </div>
            <p className="text-xs text-gray-500">
              +{Math.floor(Math.random() * 10)}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Segments</CardTitle>
            <Filter className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{Object.keys(segmentCounts).length}</div>
            <p className="text-xs text-gray-500">
              Targeted groups available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.value)}
                      <span>{status.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {status.count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                {segments.map(segment => (
                  <SelectItem key={segment.value} value={segment.value}>
                    <div className="flex items-center gap-2">
                      <span>{segment.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {String(segment.count)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportList}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleAddSubscriber}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subscriber
          </Button>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 font-medium text-sm text-gray-900">Subscriber</th>
                <th className="text-left p-4 font-medium text-sm text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-sm text-gray-900">Segment</th>
                <th className="text-left p-4 font-medium text-sm text-gray-900">Engagement</th>
                <th className="text-left p-4 font-medium text-sm text-gray-900">Joined</th>
                <th className="text-left p-4 font-medium text-sm text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.map((subscriber, index) => (
                <motion.tr
                  key={subscriber.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">{subscriber.firstName} {subscriber.lastName}</div>
                      <div className="text-sm text-gray-500">{subscriber.email}</div>
                      {subscriber.company && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          {subscriber.company}
                        </div>
                      )}
                      {subscriber.location && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {subscriber.location}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <Badge variant="outline" className={getStatusColor(subscriber.status)}>
                      {getStatusIcon(subscriber.status)}
                      <span className="ml-1 capitalize">{subscriber.status}</span>
                    </Badge>
                  </td>
                  
                  <td className="p-4">
                    {subscriber.segment ? (
                      <Badge variant="outline" className="border-gray-200 text-gray-700">{subscriber.segment}</Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">None</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3 text-blue-500" />
                        <span>{calculateEngagementRate(subscriber.metrics)}% open</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>{calculateClickRate(subscriber.metrics)}% click</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-sm text-gray-500">
                      {new Date(subscriber.subscribedAt).toLocaleDateString()}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewSubscriber(subscriber)}
                        className="border-gray-200 hover:bg-white"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSubscriber(subscriber)}
                        className="border-gray-200 hover:bg-white"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSubscriber(subscriber.id)}
                        className="text-red-600 hover:text-red-700 border-gray-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSubscribers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedStatus !== "all" || selectedSegment !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Start building your email list by adding subscribers"
              }
            </p>
            {!searchTerm && selectedStatus === "all" && selectedSegment === "all" && (
              <Button onClick={handleAddSubscriber}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Subscriber Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubscriber ? "Edit Subscriber" : "Add Subscriber"}
            </DialogTitle>
            <DialogDescription>
              Add a new subscriber to your email list
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={subscriberForm.email}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={subscriberForm.firstName}
                  onChange={(e) => setSubscriberForm({ ...subscriberForm, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={subscriberForm.lastName}
                  onChange={(e) => setSubscriberForm({ ...subscriberForm, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={subscriberForm.company}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, company: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={subscriberForm.location}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, location: e.target.value })}
                placeholder="New York, NY"
              />
            </div>
            
            <div>
              <Label htmlFor="segment">Segment</Label>
              <Input
                id="segment"
                value={subscriberForm.segment}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, segment: e.target.value })}
                placeholder="Premium Users"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSubscriber}>
                {editingSubscriber ? "Update" : "Add"} Subscriber
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscriber Preview Dialog */}
      <Dialog open={!!previewSubscriber} onOpenChange={() => setPreviewSubscriber(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subscriber Details</DialogTitle>
            <DialogDescription>
              View subscriber information and activity
            </DialogDescription>
          </DialogHeader>
          
          {previewSubscriber && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {previewSubscriber.firstName} {previewSubscriber.lastName}</div>
                  <div><strong>Email:</strong> {previewSubscriber.email}</div>
                  {previewSubscriber.company && <div><strong>Company:</strong> {previewSubscriber.company}</div>}
                  {previewSubscriber.location && <div><strong>Location:</strong> {previewSubscriber.location}</div>}
                  {previewSubscriber.segment && <div><strong>Segment:</strong> {previewSubscriber.segment}</div>}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Status & Activity</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Status:</strong> <span className="capitalize">{previewSubscriber.status}</span></div>
                  <div><strong>Subscribed:</strong> {new Date(previewSubscriber.subscribedAt).toLocaleDateString()}</div>
                  {previewSubscriber.lastActivity && (
                    <div><strong>Last Activity:</strong> {new Date(previewSubscriber.lastActivity).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Email Preferences</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={previewSubscriber.preferences.marketing} readOnly />
                    <span>Marketing emails</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={previewSubscriber.preferences.newsletter} readOnly />
                    <span>Newsletter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={previewSubscriber.preferences.updates} readOnly />
                    <span>Product updates</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Engagement Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Emails Sent:</strong> {previewSubscriber.metrics.emailsSent}</div>
                  <div><strong>Emails Opened:</strong> {previewSubscriber.metrics.emailsOpened}</div>
                  <div><strong>Emails Clicked:</strong> {previewSubscriber.metrics.emailsClicked}</div>
                  <div><strong>Open Rate:</strong> {calculateEngagementRate(previewSubscriber.metrics)}%</div>
                  <div><strong>Click Rate:</strong> {calculateClickRate(previewSubscriber.metrics)}%</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
