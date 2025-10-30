import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Settings = () => {
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();

  const handleRefreshIntervalChange = (value: string) => {
    updateSettings({ refreshInterval: parseInt(value) });
    toast.success("Refresh interval updated");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Display Preferences</CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize how data is displayed and refreshed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="refresh-interval" className="text-card-foreground">
                Data Refresh Interval
              </Label>
              <Select
                value={settings.refreshInterval.toString()}
                onValueChange={handleRefreshIntervalChange}
              >
                <SelectTrigger id="refresh-interval" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10000">10 seconds</SelectItem>
                  <SelectItem value="30000">30 seconds</SelectItem>
                  <SelectItem value="60000">1 minute</SelectItem>
                  <SelectItem value="300000">5 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often to fetch new crypto data
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-card-foreground">Theme</Label>
              <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                <p className="text-sm text-muted-foreground">
                  Binance Dark Theme (Active)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card mt-6">
          <CardHeader>
            <CardTitle className="text-card-foreground">About Intellidex</CardTitle>
            <CardDescription className="text-muted-foreground">
              Free Edition - Real-time crypto analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📊 Live market data from CoinGecko</p>
              <p>📈 Technical indicators (EMA, RSI, VWAP)</p>
              <p>🧩 ClusterDex correlation analysis</p>
              <p>📰 News sentiment analysis</p>
              <p>⚡ Built with React, TypeScript, and Tailwind CSS</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
