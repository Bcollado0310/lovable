export type PropertyStatus = 'FUNDING' | 'CLOSING_SOON' | 'FUNDED' | 'WAITLIST';

interface PropertyData {
  property_status?: string;
  current_funding?: number;
  target_funding?: number;
  funding_deadline?: string | Date;
  waitlist_open?: boolean;
  capacity_remaining?: number;
}

interface StatusInfo {
  label: string;
  variant: string;
  tooltip: string;
  pulse: boolean;
}

/**
 * Derives the investor-relevant status for a property based on data
 * Always returns exactly one status, never null
 */
export function deriveStatus(property: PropertyData): PropertyStatus {
  const currentFunding = property.current_funding || 0;
  const targetFunding = property.target_funding || 1;
  const capacityRemaining = property.capacity_remaining;
  const waitlistOpen = property.waitlist_open || false;
  const status = property.property_status?.toLowerCase();
  
  // Calculate normalized values
  const fundingProgress = targetFunding > 0 ? (currentFunding / targetFunding) * 100 : 0;
  
  // Calculate days to close
  let daysToClose = Infinity;
  if (property.funding_deadline) {
    const deadline = new Date(property.funding_deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    daysToClose = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Status derivation with precedence rules
  
  // 1. FUNDED - highest precedence
  if (
    fundingProgress >= 100 ||
    status === 'funded' ||
    status === 'closed' ||
    status === 'fully_funded' ||
    status === 'completed' ||
    (capacityRemaining !== undefined && capacityRemaining <= 0)
  ) {
    // Check if waitlist is available for fully funded properties
    if (waitlistOpen) {
      return 'WAITLIST';
    }
    return 'FUNDED';
  }
  
  // 2. CLOSING_SOON - for open offerings near completion or deadline
  const isOpenOffering = status === 'available' || status === 'funding' || !status;
  if (isOpenOffering && (fundingProgress >= 80 || daysToClose <= 7)) {
    return 'CLOSING_SOON';
  }
  
  // 3. FUNDING - default for open offerings
  if (isOpenOffering && fundingProgress < 100) {
    return 'FUNDING';
  }
  
  // 4. WAITLIST - explicit waitlist status
  if (status === 'waitlist' || waitlistOpen) {
    return 'WAITLIST';
  }
  
  // Fallback to FUNDING for any other case
  return 'FUNDING';
}

/**
 * Gets the display information for a property status
 */
export function getStatusInfo(status: PropertyStatus): StatusInfo {
  switch (status) {
    case 'FUNDING':
      return {
        label: 'FUNDING',
        variant: 'funding',
        tooltip: 'Open for investment',
        pulse: false
      };
    case 'CLOSING_SOON':
      return {
        label: 'CLOSING SOON',
        variant: 'closing',
        tooltip: 'Limited time remaining - act fast!',
        pulse: true
      };
    case 'FUNDED':
      return {
        label: 'FUNDED',
        variant: 'funded',
        tooltip: 'Fully funded and closed',
        pulse: false
      };
    case 'WAITLIST':
      return {
        label: 'WAITLIST',
        variant: 'waitlist',
        tooltip: 'Join the waitlist for future opportunities',
        pulse: false
      };
  }
}