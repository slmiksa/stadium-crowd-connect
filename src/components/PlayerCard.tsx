
import React from 'react';

interface Player {
  id: number;
  name: string;
  photo?: string;
  position?: string;
  number?: number;
  team: string;
}

interface PlayerCardProps {
  player: Player;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, className = '' }) => {
  const getPlayerImage = () => {
    if (player.photo) {
      return player.photo;
    }
    
    // صور افتراضية للاعبين حسب الموقع
    const placeholderImages = {
      'Goalkeeper': '/placeholder.svg',
      'Defender': '/placeholder.svg', 
      'Midfielder': '/placeholder.svg',
      'Attacker': '/placeholder.svg',
      'default': '/placeholder.svg'
    };
    
    return placeholderImages[player.position as keyof typeof placeholderImages] || placeholderImages.default;
  };

  const getPositionInArabic = (position?: string) => {
    const positions: { [key: string]: string } = {
      'Goalkeeper': 'حارس مرمى',
      'Defender': 'مدافع',
      'Midfielder': 'وسط ميدان', 
      'Attacker': 'مهاجم',
      'Forward': 'مهاجم',
      'Winger': 'جناح'
    };
    
    return positions[position || ''] || position || '';
  };

  return (
    <div className={`bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50 ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-700/40 border border-gray-600/30">
          <img 
            src={getPlayerImage()} 
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        
        {player.number && (
          <div className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-1">
            {player.number}
          </div>
        )}
        
        <h4 className="text-white font-bold text-sm mb-1 leading-tight">{player.name}</h4>
        
        {player.position && (
          <p className="text-gray-400 text-xs">
            {getPositionInArabic(player.position)}
          </p>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
