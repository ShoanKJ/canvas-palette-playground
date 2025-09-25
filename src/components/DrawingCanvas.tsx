import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line, Polygon, Path, Text, PencilBrush } from "fabric";
import { Button } from "./ui/button";
import { 
  Brush, 
  Eraser, 
  MousePointer, 
  Move, 
  Square, 
  Circle as CircleIcon, 
  Minus, 
  Type,
  ArrowUp,
  Download,
  FileText,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Hexagon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  shortcut?: string;
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  objects: any[];
}

const tools: Tool[] = [
  { id: "select", name: "Select", icon: MousePointer, shortcut: "V" },
  { id: "brush", name: "Brush", icon: Brush, shortcut: "B" },
  { id: "eraser", name: "Eraser", icon: Eraser, shortcut: "E" },
  { id: "line", name: "Line", icon: Minus, shortcut: "L" },
  { id: "rectangle", name: "Rectangle", icon: Square, shortcut: "R" },
  { id: "circle", name: "Circle", icon: CircleIcon, shortcut: "C" },
  { id: "text", name: "Text", icon: Type, shortcut: "T" },
  { id: "polygon", name: "Polygon", icon: Hexagon, shortcut: "P" },
  { id: "arrow", name: "Arrow", icon: ArrowUp, shortcut: "A" },
  { id: "move", name: "Pan", icon: Move, shortcut: "Space" },
];

const colorPresets = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", 
  "#ffff00", "#ff00ff", "#00ffff", "#ffa500", "#800080",
  "#ffc0cb", "#a52a2a", "#808080", "#000080", "#008000"
];

export const DrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState("brush");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([
    { id: "layer1", name: "Layer 1", visible: true, objects: [] }
  ]);
  const [currentLayer, setCurrentLayer] = useState("layer1");
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasFill, setHasFill] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight - 64,
      backgroundColor: "#ffffff",
      selection: activeTool === "select",
    });

    // Initialize drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = strokeColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    setFabricCanvas(canvas);
    saveState();

    // Resize handler
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 64,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Update drawing mode based on active tool
    fabricCanvas.isDrawingMode = activeTool === "brush" || activeTool === "eraser";
    fabricCanvas.selection = activeTool === "select";

    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeTool === "eraser" ? "#ffffff" : strokeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }

    // Set cursor based on tool
    const cursor = getCursor(activeTool);
    fabricCanvas.defaultCursor = cursor;
    fabricCanvas.hoverCursor = cursor;
    fabricCanvas.moveCursor = cursor;
  }, [activeTool, strokeColor, strokeWidth, fabricCanvas]);

  const getCursor = (tool: string) => {
    switch (tool) {
      case "brush": return "crosshair";
      case "eraser": return "crosshair";
      case "move": return "grab";
      case "select": return "default";
      default: return "crosshair";
    }
  };

  const saveState = useCallback(() => {
    if (!fabricCanvas) return;
    
    const state = JSON.stringify(fabricCanvas.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [fabricCanvas, history, historyStep]);

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      fabricCanvas?.loadFromJSON(history[newStep], () => {
        fabricCanvas.renderAll();
        setHistoryStep(newStep);
      });
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      fabricCanvas?.loadFromJSON(history[newStep], () => {
        fabricCanvas.renderAll();
        setHistoryStep(newStep);
      });
    }
  };

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
    
    if (toolId === "rectangle") {
      addRectangle();
    } else if (toolId === "circle") {
      addCircle();
    } else if (toolId === "line") {
      addLine();
    }
  };

  const addRectangle = () => {
    if (!fabricCanvas) return;
    
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: hasFill ? fillColor : "transparent",
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity / 100,
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    saveState();
    toast.success("Rectangle added");
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    
    const circle = new Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: hasFill ? fillColor : "transparent",
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity / 100,
    });
    
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    saveState();
    toast.success("Circle added");
  };

  const addLine = () => {
    if (!fabricCanvas) return;
    
    const line = new Line([50, 100, 200, 100], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity / 100,
    });
    
    fabricCanvas.add(line);
    fabricCanvas.setActiveObject(line);
    saveState();
    toast.success("Line added");
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    saveState();
    toast.success("Canvas cleared");
  };

  const saveImage = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });
    
    const link = document.createElement("a");
    link.download = "lorien-canvas.png";
    link.href = dataURL;
    link.click();
    
    toast.success("Image saved!");
  };

  const exportSVG = () => {
    if (!fabricCanvas) return;
    
    const svg = fabricCanvas.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = "lorien-canvas.svg";
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success("SVG exported!");
  };

  const handleZoom = (direction: "in" | "out" | "reset") => {
    if (!fabricCanvas) return;
    
    let newZoom = zoom;
    if (direction === "in") newZoom = Math.min(zoom + 10, 500);
    else if (direction === "out") newZoom = Math.max(zoom - 10, 10);
    else newZoom = 100;
    
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom / 100);
    fabricCanvas.renderAll();
  };

  const addLayer = () => {
    const newLayer: Layer = {
      id: `layer${layers.length + 1}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      objects: []
    };
    setLayers([...layers, newLayer]);
    setCurrentLayer(newLayer.id);
    toast.success("Layer added");
  };

  const deleteLayer = (layerId: string) => {
    if (layers.length === 1) {
      toast.error("Cannot delete the last layer");
      return;
    }
    
    const newLayers = layers.filter(layer => layer.id !== layerId);
    setLayers(newLayers);
    
    if (currentLayer === layerId) {
      setCurrentLayer(newLayers[0].id);
    }
    
    toast.success("Layer deleted");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      const tool = tools.find(t => t.shortcut?.toLowerCase() === key);
      
      if (tool) {
        e.preventDefault();
        handleToolClick(tool.id);
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            saveImage();
            break;
        }
      }
      
      if (key === 'delete' && fabricCanvas?.getActiveObject()) {
        fabricCanvas.remove(fabricCanvas.getActiveObject()!);
        saveState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, history, historyStep]);

  return (
    <div className="w-full h-screen bg-canvas-bg flex flex-col">
      {/* Top Toolbar */}
      <div className="h-16 canvas-panel border-b border-canvas-border flex items-center gap-2 px-4 z-50">
        {/* File Operations */}
        <div className="flex items-center gap-1 pr-4 border-r border-canvas-border">
          <Button variant="ghost" size="sm" onClick={clearCanvas} className="h-8 px-2">
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={saveImage} className="h-8 px-2">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={exportSVG} className="h-8 px-2">
            <FileText className="w-4 h-4" />
          </Button>
        </div>

        {/* History */}
        <div className="flex items-center gap-1 pr-4 border-r border-canvas-border">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={undo} 
            disabled={historyStep <= 0}
            className="h-8 px-2"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={redo} 
            disabled={historyStep >= history.length - 1}
            className="h-8 px-2"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 pr-4 border-r border-canvas-border">
          <Button variant="ghost" size="sm" onClick={() => handleZoom("out")} className="h-8 px-2">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-canvas-text-muted min-w-[50px] text-center">
            {zoom}%
          </span>
          <Button variant="ghost" size="sm" onClick={() => handleZoom("in")} className="h-8 px-2">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleZoom("reset")} className="h-8 px-2">
            Reset
          </Button>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-1">
          <Button 
            variant={showGrid ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setShowGrid(!showGrid)}
            className="h-8 px-2"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button 
            variant={showLayers ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setShowLayers(!showLayers)}
            className="h-8 px-2"
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        {/* Side Toolbar */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 canvas-panel-elevated rounded-xl p-2 flex flex-col gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolClick(tool.id)}
                className={cn(
                  "h-10 w-10 p-0",
                  activeTool === tool.id && "canvas-glow bg-canvas-active hover:bg-canvas-active"
                )}
                title={`${tool.name} ${tool.shortcut ? `(${tool.shortcut})` : ""}`}
              >
                <Icon className="w-5 h-5" />
              </Button>
            );
          })}
        </div>

        {/* Properties Panel */}
        <div className="absolute right-4 top-4 z-40 canvas-panel-elevated rounded-xl p-4 w-64 space-y-4">
          {/* Stroke Color */}
          <div>
            <label className="text-xs text-canvas-text-muted uppercase tracking-wide mb-2 block">
              Stroke Color
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-12 h-8 rounded-lg border border-canvas-border cursor-pointer"
              />
              <div className="flex flex-wrap gap-1">
                {colorPresets.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className="w-6 h-6 rounded border-2 border-transparent hover:border-canvas-active transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fill Color */}
          <div>
            <label className="text-xs text-canvas-text-muted uppercase tracking-wide mb-2 block">
              Fill Color
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-12 h-8 rounded-lg border border-canvas-border cursor-pointer"
              />
              <Button
                variant={hasFill ? "ghost" : "default"}
                size="sm"
                onClick={() => setHasFill(!hasFill)}
                className="text-xs h-8"
              >
                {hasFill ? "Remove Fill" : "Add Fill"}
              </Button>
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <label className="text-xs text-canvas-text-muted uppercase tracking-wide mb-2 block">
              Stroke Width
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="50"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-8 text-right">{strokeWidth}</span>
            </div>
          </div>

          {/* Opacity */}
          <div>
            <label className="text-xs text-canvas-text-muted uppercase tracking-wide mb-2 block">
              Opacity
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{opacity}%</span>
            </div>
          </div>
        </div>

        {/* Layers Panel */}
        {showLayers && (
          <div className="absolute left-20 top-4 z-40 canvas-panel-elevated rounded-xl p-4 w-56">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-canvas-text-muted uppercase tracking-wide">Layers</h3>
              <Button variant="ghost" size="sm" onClick={addLayer} className="h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                    currentLayer === layer.id ? "bg-canvas-active" : "hover:bg-canvas-hover"
                  )}
                  onClick={() => setCurrentLayer(layer.id)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle layer visibility
                    }}
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <span className="text-sm flex-1">{layer.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-canvas-error hover:text-canvas-error"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="w-full h-full bg-canvas-surface flex items-center justify-center">
          <canvas 
            ref={canvasRef}
            className="bg-white shadow-canvas-strong rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};