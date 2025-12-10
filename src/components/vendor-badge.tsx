import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, XCircle, AlertCircle } from "lucide-react";

interface VendorBadgeProps {
  vendorStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
}

export function VendorBadge({ vendorStatus, size = 'default', showIcon = true }: VendorBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 12,
    default: 14,
    lg: 16,
  };

  const iconSize = iconSizes[size];

  switch (vendorStatus) {
    case 'approved':
      return (
        <Badge variant="outline" className={`${sizeClasses[size]} border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30`}>
          {showIcon && <ShieldCheck className="mr-1" style={{ width: iconSize, height: iconSize }} />}
          Verified Vendor
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className={`${sizeClasses[size]} border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30`}>
          {showIcon && <Clock className="mr-1" style={{ width: iconSize, height: iconSize }} />}
          Unverified Vendor
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className={`${sizeClasses[size]} border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30`}>
          {showIcon && <XCircle className="mr-1" style={{ width: iconSize, height: iconSize }} />}
          Rejected
        </Badge>
      );
    case 'suspended':
      return (
        <Badge variant="outline" className={`${sizeClasses[size]} border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30`}>
          {showIcon && <AlertCircle className="mr-1" style={{ width: iconSize, height: iconSize }} />}
          Suspended
        </Badge>
      );
    default:
      return null;
  }
}
