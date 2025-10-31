'use client'

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"
import { Badge } from "@/components/ui/badge"
import { Upload, User, Mail, Phone, MapPin, FileText } from "lucide-react"
import { toast } from "sonner"

export default function Profile() {
  const { user, profile, logout, updateProfile, requestVendorVerification } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: profile?.displayName || "",
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    tradeLicense: profile?.tradeLicense || "",
    tinNumber: profile?.tinNumber || ""
  })

  const handleSave = () => {
    updateProfile(profileData)
    toast.success("Profile updated successfully")
    setEditing(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const handleVerifyVendor = () => {
    if (profileData.tradeLicense && profileData.tinNumber) {
      requestVendorVerification(profileData.tradeLicense, profileData.tinNumber)
      toast.info("Verification request sent to admin")
    } else {
      toast.error("Please provide both Trade License and TIN Number")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Profile</h1>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <div className="lg:col-span-1">
                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <User className="h-12 w-12 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold">{profile?.displayName || user?.email}</h2>
                      <p className="text-muted-foreground">{user?.email}</p>
                      <div className="mt-4">
                        <Badge variant={profile?.isVendor ? "secondary" : "outline"}>
                          {profile?.isVendor ? "VENDOR" : "USER"}
                        </Badge>
                      </div>
                      
                      {profile?.isVendor && (
                        <div className="mt-4 w-full">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Verification Status:</span>
                            {profile?.vendorStatus === 'approved' ? (
                              <Badge className="bg-green-500">Verified</Badge>
                            ) : profile?.vendorStatus === 'pending' ? (
                              <Badge className="bg-yellow-500">Pending</Badge>
                            ) : (
                              <Badge variant="destructive">Not Verified</Badge>
                            )}
                          </div>
                          {profile?.vendorStatus !== 'approved' && profile?.vendorStatus !== 'pending' && (
                            <Button 
                              className="w-full mt-2 bg-primary hover:bg-primary/90"
                              onClick={handleVerifyVendor}
                            >
                              Request Verification
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Details */}
              <div className="lg:col-span-2">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Profile Information</span>
                      {!editing ? (
                        <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                      ) : (
                        <div className="space-x-2">
                          <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                          <Button onClick={handleSave}>Save</Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input 
                          id="displayName" 
                          value={profileData.displayName} 
                          onChange={(e) => setProfileData({...profileData, displayName: e.target.value})} 
                          disabled={!editing}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            value={profileData.firstName} 
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} 
                            disabled={!editing}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={profileData.lastName} 
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} 
                            disabled={!editing}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          value={profileData.phone} 
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                          disabled={!editing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input 
                          id="address" 
                          value={profileData.address} 
                          onChange={(e) => setProfileData({...profileData, address: e.target.value})} 
                          disabled={!editing}
                          placeholder="Enter your address"
                        />
                      </div>
                      
                      {profile?.isVendor && (
                        <>
                          <div>
                            <Label htmlFor="tradeLicense">Trade License Number</Label>
                            <Input 
                              id="tradeLicense" 
                              value={profileData.tradeLicense} 
                              onChange={(e) => setProfileData({...profileData, tradeLicense: e.target.value})} 
                              disabled={!editing}
                              placeholder="Enter trade license number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tinNumber">TIN Number</Label>
                            <Input 
                              id="tinNumber" 
                              value={profileData.tinNumber} 
                              onChange={(e) => setProfileData({...profileData, tinNumber: e.target.value})} 
                              disabled={!editing}
                              placeholder="Enter TIN number"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}