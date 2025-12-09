
import React from 'react';
import { Discount } from '@/eventia-backend/models/discount.model';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Tag, Clock, User, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface DiscountListProps {
  discounts: Discount[];
  onEdit: (discount: Discount) => void;
  onDelete: (discount: Discount) => void;
}

const DiscountList: React.FC<DiscountListProps> = ({ discounts, onEdit, onDelete }) => {
  const isExpired = (date: string | undefined) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isMaxedOut = (discount: Discount) => {
    return discount.uses_count >= discount.max_uses;
  };

  return (
    <div className="space-y-4">
      {discounts.length === 0 ? (
        <p className="text-center text-gray-500">No discounts found</p>
      ) : (
        discounts.map((discount) => (
          <Card key={discount.id} className="relative overflow-hidden">
            {(isExpired(discount.expiry_date) || isMaxedOut(discount)) && (
              <div className="absolute top-0 right-0 m-2">
                <Badge variant="destructive">
                  {isExpired(discount.expiry_date) ? 'Expired' : 'Max Uses Reached'}
                </Badge>
              </div>
            )}
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{discount.code}</h3>
                  {discount.description && (
                    <p className="text-sm text-gray-600 mt-1">{discount.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-lg">
                  ₹{discount.amount}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 mt-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Tag className="h-4 w-4 mr-2" />
                  <span>Discount Amount: ₹{discount.amount}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>Uses: {discount.uses_count}/{discount.max_uses}</span>
                </div>
                {discount.expiry_date && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Expires: {format(new Date(discount.expiry_date), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Created: {format(new Date(discount.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t flex justify-end space-x-2 bg-gray-50 py-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600" 
                onClick={() => onEdit(discount)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600" 
                onClick={() => onDelete(discount)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
};

export default DiscountList;
