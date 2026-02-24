import { Cpu, Gauge, RotateCw, Zap, Copy, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useThresholdConfig } from '@/contexts/ThresholdConfigContext';
import { BUILTIN_PRESETS, duplicateBuiltInPreset } from '@/lib/threshold-definitions';

interface MachineCharacteristicsCardProps {
  className?: string;
  compact?: boolean;
  onEditPreset?: (presetId: string) => void;
}

export function MachineCharacteristicsCard({
  className,
  compact = false,
  onEditPreset,
}: MachineCharacteristicsCardProps) {
  const {
    selectedPreset,
    userPresets,
    getCurrentDeliveryParams,
    getCurrentThresholds,
    getPresetName,
    addUserPreset,
    setPreset,
  } = useThresholdConfig();

  const params = getCurrentDeliveryParams();
  const thresholds = getCurrentThresholds();
  const presetName = getPresetName();
  const isBuiltIn = selectedPreset in BUILTIN_PRESETS;
  const builtInConfig = isBuiltIn ? BUILTIN_PRESETS[selectedPreset] : null;

  const handleDuplicate = () => {
    if (!isBuiltIn) return;
    const newPreset = duplicateBuiltInPreset(selectedPreset, `${presetName} (Copy)`);
    addUserPreset(newPreset);
    setPreset(newPreset.id);
    onEditPreset?.(newPreset.id);
  };

  const handleEdit = () => {
    onEditPreset?.(selectedPreset);
  };

  // Count warning/critical thresholds
  const thresholdKeys = Object.keys(thresholds);
  const thresholdSummary = thresholdKeys
    .slice(0, 3)
    .map((k) => {
      const t = thresholds[k];
      const dir = t.direction === 'low' ? '<' : '>';
      return `${k}${dir}${t.warningThreshold}`;
    })
    .join('  ');

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className ?? ''}`}>
        <Badge variant="secondary" className="gap-1 font-normal">
          <Cpu className="h-3 w-3" />
          {presetName}
        </Badge>
        <span className="text-muted-foreground">
          {params.mlcModel || params.mlcType} · {params.maxDoseRate} MU/min
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-muted/30 p-3 space-y-2.5 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{presetName}</span>
          {isBuiltIn && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">Built-in</Badge>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {isBuiltIn ? (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDuplicate}>
                  <Copy className="h-3 w-3" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleEdit}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent>
              {isBuiltIn ? 'Duplicate & Edit' : 'Edit Preset'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* MLC info */}
      <div className="text-xs text-muted-foreground">
        {params.mlcModel || params.mlcType} · {params.mlcType}
        {builtInConfig?.description && (
          <span className="ml-1">— {builtInConfig.description}</span>
        )}
      </div>

      {/* Delivery params grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Dose Rate:</span>
          <span className="font-medium">{params.maxDoseRate} MU/min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RotateCw className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Gantry:</span>
          <span className="font-medium">{params.maxGantrySpeed} °/s</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">MLC Speed:</span>
          <span className="font-medium">{params.maxMLCSpeed} mm/s</span>
        </div>
        {(params.maxDoseRateFFF || params.energyDoseRates?.some(e => e.energy.includes('FFF'))) && (
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">FFF:</span>
            <span className="font-medium">
              {params.maxDoseRateFFF ||
                params.energyDoseRates?.find(e => e.energy.includes('FFF'))?.maxDoseRate ||
                '—'}{' '}
              MU/min
            </span>
          </div>
        )}
      </div>

      {/* Threshold summary */}
      <div className="border-t pt-2 text-[10px] font-mono text-muted-foreground">
        Thresholds: {thresholdSummary}
        {thresholdKeys.length > 3 && ` +${thresholdKeys.length - 3} more`}
      </div>
    </div>
  );
}
