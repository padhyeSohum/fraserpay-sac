
import React from 'react';
import { Button } from '@/components/ui/button';
import { supportsAppleWallet } from '@/utils/appleWallet';
import { toast } from 'sonner';

// Apple Wallet badge SVG (official Apple design)
const AppleWalletBadge = () => (
  <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <rect width="120" height="40" rx="5" fill="black"/>
      <path d="M49.3105 28H51.6299V12.3496H49.3105V28ZM72.6299 21.7334C72.6299 17.7812 70.5605 15.0586 67.0371 15.0586C65.0303 15.0586 63.3877 16.0605 62.7588 17.5215H62.6201V15.3281H60.4414V28H62.7207V21.3916C62.7207 19.2334 64.0625 17.625 66.0771 17.625C68.0908 17.625 69.3516 19.1768 69.3516 21.7334V28H71.6308V21.3916C71.6308 19.2334 72.954 17.625 74.9873 17.625C76.9658 17.625 78.2549 19.1768 78.2549 21.7334V28H80.5342V21.3145C80.5342 17.8584 78.5928 15.0586 75.3135 15.0586C73.3213 15.0586 71.7275 16.0889 71.0225 17.5215H70.8838C70.2158 16.1309 68.6787 15.0586 66.7275 15.0586C64.9033 15.0586 63.4707 16.0322 62.8135 17.4512H62.6748V15.3281H60.4961V28H62.7754V21.3916C62.7754 19.2334 64.1172 17.625 66.1318 17.625C68.1455 17.625 69.4062 19.1768 69.4062 21.7334V28H71.6855V21.3916C71.6855 19.2334 73.0088 17.625 75.042 17.625C77.0205 17.625 78.3096 19.1768 78.3096 21.7334V28H80.5889V21.3145C80.5889 17.8584 78.6475 15.0586 75.3682 15.0586C73.376 15.0586 71.7822 16.0889 71.0771 17.5215H70.9385C70.2705 16.1309 68.7334 15.0586 66.7822 15.0586C64.958 15.0586 63.5254 16.0322 62.8682 17.4512H62.7295V15.3281H60.5508V28H62.8301V21.3916C62.8301 19.2334 64.1719 17.625 66.1865 17.625C68.2002 17.625 69.4609 19.1768 69.4609 21.7334V28H72.6299Z" fill="white"/>
      <path d="M30.9707 8.4668C32.4795 8.4668 33.9102 9.39746 34.5977 10.8418C34.8311 11.3604 35.1143 12.2441 35.0283 13.3408C33.9082 13.3877 32.5811 12.6953 31.8584 11.2734C31.6416 10.8291 31.3408 9.92871 31.4473 9.01074C32.2734 8.9668 32.6543 8.4668 30.9707 8.4668ZM34.9551 13.6934C33.3906 13.6934 32.1562 14.6377 31.3887 14.6377C30.5752 14.6377 29.4902 13.7334 28.2305 13.7334C26.0361 13.7334 23.7285 15.5635 23.7285 19.1523C23.7285 21.4717 24.5186 23.874 25.5938 25.4248C26.4971 26.7188 27.2666 27.7012 28.3564 27.7012C29.4111 27.7012 29.8477 27.0557 31.1094 27.0557C32.4004 27.0557 32.7617 27.7012 33.9453 27.7012C35.084 27.7012 35.8125 26.6504 36.5693 25.4873C37.4316 24.1357 37.7842 22.8418 37.8008 22.7705C37.7617 22.7588 35.4189 21.8086 35.4189 19.2021C35.4189 17.0137 37.2725 16.0137 37.3691 15.9424C36.2324 14.3301 34.498 14.2529 33.9453 14.2529C32.6602 14.2529 31.5879 15.1777 31.0117 15.1777C30.5117 15.1777 29.5566 14.2969 34.9551 13.6934Z" fill="white"/>
    </g>
  </svg>
);

interface AppleWalletButtonProps {
  onAddToWallet: () => void;
  isDisabled?: boolean;
}

const AppleWalletButton: React.FC<AppleWalletButtonProps> = ({ 
  onAddToWallet,
  isDisabled = false
}) => {
  const handleClick = () => {
    if (!supportsAppleWallet()) {
      toast.error("Apple Wallet passes are only supported on iOS devices using Safari.");
      return;
    }
    
    try {
      onAddToWallet();
    } catch (error) {
      console.error("Error handling wallet button click:", error);
      toast.error("Failed to generate Apple Wallet pass");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isDisabled}
        className="w-full relative group"
      >
        <div className="flex items-center justify-center w-full">
          <AppleWalletBadge />
        </div>
      </Button>
      {!supportsAppleWallet() && (
        <p className="text-xs text-muted-foreground text-center">
          Apple Wallet passes are only supported on iOS devices using Safari.
        </p>
      )}
    </div>
  );
};

export default AppleWalletButton;
