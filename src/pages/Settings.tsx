import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [companyName, setCompanyName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (data) {
        setCompanyName(data.company_name || '');
      }
      
      return data;
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (updatedData: { company_name?: string; logo_url?: string; favicon_url?: string }) => {
      if (!settings?.id) {
        // Insert new settings if none exist
        const { data, error } = await supabase
          .from('company_settings')
          .insert(updatedData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Update existing settings
        const { data, error } = await supabase
          .from('company_settings')
          .update(updatedData)
          .eq('id', settings.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: "Settings Updated",
        description: "Company settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update company settings.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    }
  });

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setIsUploading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      
      // Upload file to Supabase Storage with cache busting
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, logoFile, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL with timestamp to avoid caching
      const timestamp = Date.now();
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);
      
      const cacheBustedUrl = `${publicUrl}?v=${timestamp}`;

      // Update settings with new logo URL
      await updateSettings.mutateAsync({ logo_url: cacheBustedUrl });
      
      // Force refresh of company settings in sidebar
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      
      setLogoFile(null);
      toast({
        title: "Logo Uploaded",
        description: "Company logo has been successfully uploaded and will appear shortly.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) return;

    setIsUploading(true);
    try {
      const fileExt = faviconFile.name.split('.').pop();
      const fileName = `favicon.${fileExt}`;
      
      // Upload file to Supabase Storage with cache busting
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, faviconFile, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL with timestamp to avoid caching
      const timestamp = Date.now();
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);
      
      const cacheBustedUrl = `${publicUrl}?v=${timestamp}`;

      // Update settings with new favicon URL
      await updateSettings.mutateAsync({ favicon_url: cacheBustedUrl });
      
      // Update the actual favicon in the document
      const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = cacheBustedUrl;
      }
      
      setFaviconFile(null);
      toast({
        title: "Favicon Uploaded",
        description: "Favicon has been successfully uploaded and updated.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload favicon. Please try again.",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCompanyName = () => {
    updateSettings.mutate({ company_name: companyName });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your company settings</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Name */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company name and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <Button 
                onClick={handleSaveCompanyName}
                disabled={updateSettings.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSettings.isPending ? 'Saving...' : 'Save Name'}
              </Button>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
              <CardDescription>
                Upload your company logo (PNG, JPG, or SVG)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.logo_url && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Current Logo:</p>
                  <img 
                    src={settings.logo_url} 
                    alt="Company Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="logo-upload">Choose Logo File</Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
              </div>
              
              <Button 
                onClick={handleLogoUpload}
                disabled={!logoFile || isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
            </CardContent>
          </Card>

          {/* Favicon Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Website Favicon</CardTitle>
              <CardDescription>
                Upload your website favicon (PNG, ICO, or JPG)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.favicon_url && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Current Favicon:</p>
                  <img 
                    src={settings.favicon_url} 
                    alt="Website Favicon" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="favicon-upload">Choose Favicon File</Label>
                <Input
                  id="favicon-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                />
              </div>
              
              <Button 
                onClick={handleFaviconUpload}
                disabled={!faviconFile || isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Favicon'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;