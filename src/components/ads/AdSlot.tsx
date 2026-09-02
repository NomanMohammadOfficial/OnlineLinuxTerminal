import React, { useEffect } from 'react';

interface AdSlotProps {
  type?: 'banner' | 'leaderboard' | 'sidebar';
  adClient?: string;
  adSlot?: string;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  type = 'banner',
  adClient,
  adSlot,
  className = '',
}) => {
  useEffect(() => {
    if (adClient && adSlot && typeof window !== 'undefined') {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // AdSense push error handle
      }
    }
  }, [adClient, adSlot]);

  // If no AdSense slot configured, return null or an unobtrusive empty container
  // to prevent Google crawlers from flagging dummy placeholder boxes
  if (!adClient || !adSlot) {
    return null;
  }

  let slotStyle = { display: 'block' };
  let slotFormat = 'auto';

  return (
    <div className={`w-full overflow-hidden my-4 text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={slotStyle}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={slotFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

