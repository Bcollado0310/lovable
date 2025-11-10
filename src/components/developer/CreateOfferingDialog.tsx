import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PercentInput } from "@/components/ui/percent-input";
import { FileUpload, FileWithPreview } from "@/components/ui/file-upload";
import { useDeveloperAuth } from "@/contexts/DeveloperAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const offeringSchema = z.object({
  // Basics
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  summary: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  type: z.string().min(1, "Property type is required"),
  tags: z.array(z.string()).default([]),
  
  // Financials
  goal: z.number().min(1, "Goal amount is required"),
  soft_cap: z.number().min(0).optional(),
  hard_cap: z.number().min(0).optional(),
  min_invest: z.number().min(1, "Minimum investment is required"),
  step_invest: z.number().min(1, "Investment step is required"),
  max_invest: z.number().min(0).optional(),
  valuation: z.number().min(0).optional(),
  target_irr: z.number().min(0).max(100).optional(),
  equity_multiple: z.number().min(0).optional(),
  hold_years: z.number().min(1).max(50).optional(),
  distribution_freq: z.string().optional(),
  close_date: z.date().optional(),
  
  // Visibility & Risk
  risk_bucket: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_private: z.boolean().default(false),
  
  // Files will be handled separately
});

interface CreateOfferingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (offering: any) => void;
}

export function CreateOfferingDialog({ open, onOpenChange, onSuccess }: CreateOfferingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const { organization } = useDeveloperAuth();
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof offeringSchema>>({
    resolver: zodResolver(offeringSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      address: "",
      city: "",
      state: "",
      country: "",
      type: "",
      tags: [],
      goal: 0,
      soft_cap: undefined,
      hard_cap: undefined,
      min_invest: 1000,
      step_invest: 1000,
      max_invest: undefined,
      valuation: undefined,
      target_irr: undefined,
      equity_multiple: undefined,
      hold_years: undefined,
      distribution_freq: "",
      close_date: undefined,
      risk_bucket: "",
      is_featured: false,
      is_private: false,
    },
  });

  const uploadFilesToStorage = async (offeringId: string) => {
    if (files.length === 0) return [];

    setUploading(true);
    const uploadedMedia: any[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress to 0
        const updatedFiles = [...files];
        updatedFiles[i] = { ...updatedFiles[i], progress: 0 };
        setFiles(updatedFiles);

        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${organization.id}/${offeringId}/${fileName}`;

        // Simulate upload progress for demo (replace with actual progress tracking)
        const uploadPromise = supabase.storage
          .from('offering-media')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false
          });

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          const currentFiles = [...files];
          const currentProgress = currentFiles[i].progress || 0;
          if (currentProgress < 90) {
            currentFiles[i] = { ...currentFiles[i], progress: currentProgress + 10 };
            setFiles([...currentFiles]);
          }
        }, 100);

        const { error: uploadError } = await uploadPromise;
        clearInterval(progressInterval);

        if (uploadError) {
          console.error('Upload error for', fileName, ':', uploadError);
          // Update progress to show error
          const errorFiles = [...files];
          errorFiles[i] = { ...errorFiles[i], progress: 0 };
          setFiles(errorFiles);
          continue;
        }

        // Update progress to 100
        const completedFiles = [...files];
        completedFiles[i] = { ...completedFiles[i], progress: 100, uploaded: true };
        setFiles(completedFiles);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('offering-media')
          .getPublicUrl(filePath);

        // Save to offering_media table
        const mediaKind = file.type.startsWith('video/') ? 'video' : 'image';
        const { data: mediaData, error: mediaError } = await supabase
          .from('offering_media')
          .insert({
            offering_id: offeringId,
            url: urlData.publicUrl,
            kind: mediaKind,
            position: i
          })
          .select()
          .single();

        if (mediaError) {
          console.error('Media record error:', mediaError);
          continue;
        }

        uploadedMedia.push(mediaData);
      }

      return uploadedMedia;
    } finally {
      setUploading(false);
    }
  };

  const updateMediaPositions = async (mediaItems: any[]) => {
    try {
      const updates = mediaItems.map((item, index) => 
        supabase
          .from('offering_media')
          .update({ position: index })
          .eq('id', item.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating media positions:', error);
    }
  };

  const onSubmit = async (data: z.infer<typeof offeringSchema>) => {
    if (!organization?.id) {
      toast.error("No organization found");
      return;
    }

    setLoading(true);
    let offeringCreated = false;
    let createdOfferingId: string | null = null;
    
    try {
      // Prepare the form data with proper types
      const formPayload = {
        title: data.title,
        summary: data.summary || null,
        description: data.description || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        type: data.type,
        tags: data.tags,
        goal: data.goal,
        soft_cap: data.soft_cap || null,
        hard_cap: data.hard_cap || null,
        min_invest: data.min_invest,
        step_invest: data.step_invest,
        max_invest: data.max_invest || null,
        valuation: data.valuation || null,
        target_irr: data.target_irr || null,
        equity_multiple: data.equity_multiple || null,
        hold_years: data.hold_years || null,
        distribution_freq: data.distribution_freq || null,
        close_date: data.close_date ? data.close_date.toISOString() : null,
        risk_bucket: data.risk_bucket || null,
        is_featured: data.is_featured,
        is_private: data.is_private,
      };

      console.log('Creating offering with payload:', formPayload);

      // Call the create-offering edge function
      const { data: response, error } = await supabase.functions.invoke('create-offering', {
        body: {
          orgId: organization.id,
          form: formPayload
        }
      });

      console.log('Edge function response:', response);
      console.log('Edge function error:', error);

      if (error) {
        console.error('Edge function error details:', error);
        throw new Error(`Function call failed: ${error.message || 'Unknown error'}`);
      }

      if (!response?.success) {
        const errorMessage = response?.error || 'Failed to create offering';
        console.error('Offering creation failed:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Offering created successfully:', response);
      offeringCreated = true;
      createdOfferingId = response.offeringId;

      // Create optimistic offering data
      const optimisticOffering = {
        id: response.offeringId,
        organization_id: organization.id,
        title: data.title,
        description: data.description || '',
        location: data.city || data.address || '',
        property_type: data.type,
        target_amount: data.goal,
        raised_amount: 0,
        minimum_investment: data.min_invest,
        expected_annual_return: data.target_irr || undefined,
        status: 'coming_soon' as const,
        funding_deadline: data.close_date?.toISOString() || undefined,
        images: [],
        documents: [],
        investor_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Handle file uploads if any
      let uploadedMedia: any[] = [];
      if (files.length > 0 && response.offeringId) {
        try {
          console.log(`Attempting to upload ${files.length} files for offering ${response.offeringId}`);
          uploadedMedia = await uploadFilesToStorage(response.offeringId);

          // Set cover URL to first image if we have successful uploads
          if (uploadedMedia.length > 0) {
            const firstImage = uploadedMedia.find(media => media.kind === 'image');
            if (firstImage) {
              console.log('Setting cover URL to:', firstImage.url);
              await supabase
                .from('offerings')
                .update({ cover_url: firstImage.url })
                .eq('id', response.offeringId);
              
              // Update optimistic offering with cover image
              optimisticOffering.images = [firstImage.url];
            }
          }

          console.log(`Successfully uploaded ${uploadedMedia.length} files out of ${files.length}`);
        } catch (mediaError) {
          console.error('Media upload failed:', mediaError);
          
          // Show warning but don't fail the entire operation
          const mediaErrorMessage = mediaError instanceof Error ? mediaError.message : 'Media upload failed';
          toast.error(`Offering created but media upload failed: ${mediaErrorMessage}. You can add images later by editing the offering.`);
          
          // Still add the offering to the list without images
          onSuccess?.(optimisticOffering);
          
          // Reset form but keep files for potential retry
          form.reset();
          onOpenChange(false);
          navigate(`/dev/offerings`);
          return;
        }
      }

      // Call onSuccess callback for optimistic update
      onSuccess?.(optimisticOffering);

      const successMessage = uploadedMedia.length > 0 
        ? `Offering "${data.title}" created with ${uploadedMedia.length} media files!`
        : `Offering "${data.title}" created successfully!`;
      
      toast.success(successMessage);
      form.reset();
      setFiles([]);
      onOpenChange(false);
      
      // Navigate to the offerings list to see the new offering
      navigate(`/dev/offerings`);
    } catch (error) {
      console.error('Error in offering creation process:', error);
      
      // Provide specific error message
      let errorMessage = 'Failed to create offering';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // If offering was created but something else failed, be more specific
      if (offeringCreated && createdOfferingId) {
        errorMessage = `Offering created but there was an issue: ${errorMessage}`;
        toast.error(errorMessage);
        
        // Still try to add optimistic update if we have the ID
        const partialOffering = {
          id: createdOfferingId,
          organization_id: organization.id,
          title: data.title,
          description: data.description || '',
          location: data.city || data.address || '',
          property_type: data.type,
          target_amount: data.goal,
          raised_amount: 0,
          minimum_investment: data.min_invest,
          expected_annual_return: data.target_irr || undefined,
          status: 'coming_soon' as const,
          funding_deadline: data.close_date?.toISOString() || undefined,
          images: [],
          documents: [],
          investor_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        onSuccess?.(partialOffering);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileReorder = (newFiles: FileWithPreview[]) => {
    setFiles(newFiles);
    // If files have been uploaded and have IDs, update positions in database
    if (newFiles.some(f => f.uploaded)) {
      // This would be called when reordering already uploaded files
      // For now, we'll just update the local state and handle DB updates on save
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create New Offering</DialogTitle>
          <DialogDescription>
            Launch a new investment opportunity for your organization.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basics" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="visibility">Visibility & Risk</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>
              
              <div className="mt-6 max-h-[400px] overflow-y-auto pr-2">
                <TabsContent value="basics" className="space-y-4 mt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter offering title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="mixed-use">Mixed Use</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Summary</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief one-line description" {...field} />
                        </FormControl>
                        <FormDescription>
                          A concise summary that appears in listings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed description of the investment opportunity..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="financials" className="space-y-4 mt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding Goal *</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Target amount to raise"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Property valuation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="soft_cap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soft Cap</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Minimum to proceed"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hard_cap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hard Cap</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Maximum to raise"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="min_invest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Investment *</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Minimum investment"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="step_invest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Step *</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Investment increments"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_invest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Investment</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Maximum per investor"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="target_irr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target IRR</FormLabel>
                          <FormControl>
                            <PercentInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Expected annual return"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="equity_multiple"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equity Multiple</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="e.g., 1.5"
                            />
                          </FormControl>
                          <FormDescription>Total return multiple</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="hold_years"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hold Period (Years)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="50"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="Expected hold period"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="distribution_freq"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distribution Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                              <SelectItem value="at-exit">At Exit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="close_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Closing Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a closing date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the offering closes to new investments
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="visibility" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="risk_bucket"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low Risk</SelectItem>
                            <SelectItem value="medium">Medium Risk</SelectItem>
                            <SelectItem value="high">High Risk</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Risk assessment for this investment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="is_featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Featured Offering</FormLabel>
                            <FormDescription>
                              Show this offering prominently in listings
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_private"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Private Offering</FormLabel>
                            <FormDescription>
                              Only show to invited investors
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-0">
                  <div>
                    <Label className="text-base font-medium">Images & Documents</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload images and documents for this offering. Drag to reorder - the first image will be used as the cover.
                    </p>
                    <FileUpload
                      value={files}
                      onChange={handleFileReorder}
                      accept="image/*,application/pdf,.doc,.docx"
                      maxFiles={10}
                      showPreviews={true}
                    />
                    {uploading && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          Uploading files... Please don't close this window.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading || uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploading ? "Uploading..." : "Creating..."}
                  </>
                ) : (
                  "Create Offering"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}