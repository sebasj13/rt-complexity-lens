import { Settings, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface OutlierConfig {
  zScoreThreshold: number;
  criticalZScoreThreshold: number;
  minPlans: number;
}

export const DEFAULT_OUTLIER_CONFIG: OutlierConfig = {
  zScoreThreshold: 2.0,
  criticalZScoreThreshold: 3.0,
  minPlans: 5,
};

interface OutlierSettingsProps {
  config: OutlierConfig;
  onChange: (config: OutlierConfig) => void;
}

export function OutlierSettings({ config, onChange }: OutlierSettingsProps) {
  const isDefault =
    config.zScoreThreshold === DEFAULT_OUTLIER_CONFIG.zScoreThreshold &&
    config.criticalZScoreThreshold === DEFAULT_OUTLIER_CONFIG.criticalZScoreThreshold &&
    config.minPlans === DEFAULT_OUTLIER_CONFIG.minPlans;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Outlier Detection Settings</h4>
          </div>

          {/* Warning Z-Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Warning Z-Score</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {config.zScoreThreshold.toFixed(1)}σ
              </span>
            </div>
            <Slider
              value={[config.zScoreThreshold]}
              onValueChange={([v]) => {
                onChange({
                  ...config,
                  zScoreThreshold: v,
                  // Ensure critical is always >= warning
                  criticalZScoreThreshold: Math.max(config.criticalZScoreThreshold, v + 0.5),
                });
              }}
              min={1.0}
              max={4.0}
              step={0.1}
            />
            <p className="text-[10px] text-muted-foreground">
              Flag metrics deviating beyond this threshold
            </p>
          </div>

          {/* Critical Z-Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Critical Z-Score</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {config.criticalZScoreThreshold.toFixed(1)}σ
              </span>
            </div>
            <Slider
              value={[config.criticalZScoreThreshold]}
              onValueChange={([v]) => {
                onChange({
                  ...config,
                  criticalZScoreThreshold: v,
                  // Ensure warning is always <= critical
                  zScoreThreshold: Math.min(config.zScoreThreshold, v - 0.5),
                });
              }}
              min={2.0}
              max={5.0}
              step={0.1}
            />
            <p className="text-[10px] text-muted-foreground">
              Mark as critical above this threshold
            </p>
          </div>

          {/* Min Plans */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Minimum Plans Required</Label>
            </div>
            <Input
              type="number"
              value={config.minPlans}
              onChange={(e) =>
                onChange({
                  ...config,
                  minPlans: Math.max(3, Math.min(20, parseInt(e.target.value) || 3)),
                })
              }
              min={3}
              max={20}
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Minimum cohort size for statistical analysis (3–20)
            </p>
          </div>

          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            disabled={isDefault}
            onClick={() => onChange({ ...DEFAULT_OUTLIER_CONFIG })}
          >
            <RotateCcw className="h-3 w-3" />
            Reset to Defaults
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
