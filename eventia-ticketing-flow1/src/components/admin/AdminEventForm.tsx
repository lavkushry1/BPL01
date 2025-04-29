import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent, updateEvent, EventInput } from '@/services/api/adminEventApi';
import { Event } from '@/services/api/eventApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Image } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminEventFormProps {
  event?: Event; // Existing event for editing
  onClose: () => void;
}

const CATEGORIES = [
  'Music',
  'Sports',
  'Theatre',
  'Conference',
  'Exhibition',
  'Workshop',
  'Cricket',
  'IPL'
];

const AdminEventForm: React.FC<AdminEventFormProps> = ({ event, onClose }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Initialize form with event data if editing
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<EventInput>({
    defaultValues: event ? {
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location || '',
      status: event.status || 'draft',
      category: event.category || 'Music',
      venue: event.venue || '',
      time: event.time || '',
      duration: event.duration || '',
      featured: event.featured || false,
      posterImage: event.posterImage || '',
      images: event.images || [],
      ticket_types: event.ticket_types || [],
      teams: event.teams || undefined
    } : {
      title: '',
      description: '',
      start_date: new Date().toISOString(),
      end_date: undefined,
      location: '',
      status: 'draft',
      category: 'Music',
      featured: false,
      images: [{ url: '', alt_text: '', is_featured: true }],
      ticket_types: [{ name: 'General Admission', description: '', price: 0, quantity: 0 }]
    }
  });
  
  // Field arrays for images and ticket types
  const { 
    fields: imageFields, 
    append: appendImage, 
    remove: removeImage 
  } = useFieldArray({
    control,
    name: 'images'
  });
  
  const { 
    fields: ticketFields, 
    append: appendTicket, 
    remove: removeTicket 
  } = useFieldArray({
    control,
    name: 'ticket_types'
  });
  
  // Create event mutation
  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Event created successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
      console.error('Create error:', error);
      setIsSubmitting(false);
    }
  });
  
  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<EventInput> }) => updateEvent(id, data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Event updated successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
      console.error('Update error:', error);
      setIsSubmitting(false);
    }
  });
  
  // Watch category to determine if IPL fields should be shown
  const watchCategory = watch('category');
  const isIPLEvent = watchCategory === 'Cricket' || watchCategory === 'IPL';
  
  // Set date handlers
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setValue('start_date', date.toISOString());
    }
  };
  
  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setValue('end_date', date.toISOString());
    }
  };
  
  // Form submission handler
  const onSubmit = async (data: EventInput) => {
    setIsSubmitting(true);
    
    try {
      if (event) {
        // Update existing event
        await updateMutation.mutateAsync({ id: event.id, data });
      } else {
        // Create new event
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error handling is done in the mutation callbacks
      console.error('Form submission error:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="media">Images</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          {isIPLEvent && <TabsTrigger value="teams">Teams</TabsTrigger>}
        </TabsList>
        
        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title*</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category*</Label>
              <Select
                defaultValue={event?.category || 'Music'}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              placeholder="Enter event description"
              rows={4}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date*</Label>
              <DatePicker
                date={event?.start_date ? new Date(event.start_date) : undefined}
                onSelect={handleStartDateChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker
                date={event?.end_date ? new Date(event.end_date) : undefined}
                onSelect={handleEndDateChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location*</Label>
              <Input
                id="location"
                {...register('location', { required: 'Location is required' })}
                placeholder="Enter event location"
              />
              {errors.location && (
                <p className="text-red-500 text-sm">{errors.location.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="venue">Venue Name</Label>
              <Input
                id="venue"
                {...register('venue')}
                placeholder="e.g. Madison Square Garden"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                {...register('time')}
                placeholder="e.g. 19:30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                {...register('duration')}
                placeholder="e.g. 3 hours"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status*</Label>
              <Select
                defaultValue={event?.status || 'draft'}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="featured"
                checked={watch('featured')}
                onCheckedChange={(checked) => setValue('featured', checked)}
              />
              <Label htmlFor="featured">Featured Event</Label>
            </div>
          </div>
        </TabsContent>
        
        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="posterImage">Poster Image URL</Label>
            <Input
              id="posterImage"
              {...register('posterImage')}
              placeholder="Enter poster image URL"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Event Images</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendImage({ url: '', alt_text: '', is_featured: false })}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Image
              </Button>
            </div>
            
            {imageFields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-md space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Image {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`images.${index}.url`}>Image URL*</Label>
                  <Input
                    id={`images.${index}.url`}
                    {...register(`images.${index}.url` as const, { required: 'URL is required' })}
                    placeholder="Enter image URL"
                  />
                  {errors.images?.[index]?.url && (
                    <p className="text-red-500 text-sm">{errors.images[index]?.url?.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`images.${index}.alt_text`}>Alt Text</Label>
                  <Input
                    id={`images.${index}.alt_text`}
                    {...register(`images.${index}.alt_text` as const)}
                    placeholder="Describe the image"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`images.${index}.is_featured`}
                    checked={watch(`images.${index}.is_featured`)}
                    onCheckedChange={(checked) => setValue(`images.${index}.is_featured` as const, checked)}
                  />
                  <Label htmlFor={`images.${index}.is_featured`}>Featured Image</Label>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Ticket Types</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendTicket({ name: '', description: '', price: 0, quantity: 0 })}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Ticket Type
            </Button>
          </div>
          
          {ticketFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Ticket Type {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTicket(index)}
                  className="text-red-500"
                  disabled={ticketFields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`ticket_types.${index}.name`}>Name*</Label>
                  <Input
                    id={`ticket_types.${index}.name`}
                    {...register(`ticket_types.${index}.name` as const, { required: 'Name is required' })}
                    placeholder="e.g. General Admission"
                  />
                  {errors.ticket_types?.[index]?.name && (
                    <p className="text-red-500 text-sm">{errors.ticket_types[index]?.name?.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`ticket_types.${index}.description`}>Description</Label>
                  <Input
                    id={`ticket_types.${index}.description`}
                    {...register(`ticket_types.${index}.description` as const)}
                    placeholder="Describe the ticket type"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`ticket_types.${index}.price`}>Price*</Label>
                  <Input
                    id={`ticket_types.${index}.price`}
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`ticket_types.${index}.price` as const, { 
                      required: 'Price is required',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Price must be positive' }
                    })}
                    placeholder="Enter price"
                  />
                  {errors.ticket_types?.[index]?.price && (
                    <p className="text-red-500 text-sm">{errors.ticket_types[index]?.price?.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`ticket_types.${index}.quantity`}>Quantity*</Label>
                  <Input
                    id={`ticket_types.${index}.quantity`}
                    type="number"
                    min="0"
                    step="1"
                    {...register(`ticket_types.${index}.quantity` as const, { 
                      required: 'Quantity is required',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Quantity must be positive' }
                    })}
                    placeholder="Enter quantity"
                  />
                  {errors.ticket_types?.[index]?.quantity && (
                    <p className="text-red-500 text-sm">{errors.ticket_types[index]?.quantity?.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`ticket_types.${index}.available`}>Available</Label>
                <Input
                  id={`ticket_types.${index}.available`}
                  type="number"
                  min="0"
                  step="1"
                  {...register(`ticket_types.${index}.available` as const, { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Available must be positive' }
                  })}
                  placeholder="Leave empty to use quantity"
                />
                {errors.ticket_types?.[index]?.available && (
                  <p className="text-red-500 text-sm">{errors.ticket_types[index]?.available?.message}</p>
                )}
              </div>
            </div>
          ))}
        </TabsContent>
        
        {/* Teams Tab (Only for IPL Events) */}
        {isIPLEvent && (
          <TabsContent value="teams" className="space-y-4">
            <div className="border p-4 rounded-md space-y-4">
              <h4 className="font-medium">Team 1</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teams.team1.name">Team Name*</Label>
                  <Input
                    id="teams.team1.name"
                    {...register('teams.team1.name')}
                    placeholder="e.g. Mumbai Indians"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="teams.team1.shortName">Short Name</Label>
                  <Input
                    id="teams.team1.shortName"
                    {...register('teams.team1.shortName')}
                    placeholder="e.g. MI"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teams.team1.logo">Logo URL</Label>
                <Input
                  id="teams.team1.logo"
                  {...register('teams.team1.logo')}
                  placeholder="Enter logo URL"
                />
              </div>
            </div>
            
            <div className="border p-4 rounded-md space-y-4">
              <h4 className="font-medium">Team 2</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teams.team2.name">Team Name*</Label>
                  <Input
                    id="teams.team2.name"
                    {...register('teams.team2.name')}
                    placeholder="e.g. Chennai Super Kings"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="teams.team2.shortName">Short Name</Label>
                  <Input
                    id="teams.team2.shortName"
                    {...register('teams.team2.shortName')}
                    placeholder="e.g. CSK"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teams.team2.logo">Logo URL</Label>
                <Input
                  id="teams.team2.logo"
                  {...register('teams.team2.logo')}
                  placeholder="Enter logo URL"
                />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {event ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            event ? 'Update Event' : 'Create Event'
          )}
        </Button>
      </div>
    </form>
  );
};

export default AdminEventForm; 