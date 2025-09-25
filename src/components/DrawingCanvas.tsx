import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line, PencilBrush, FabricObject, Polygon, FabricText } from "fabric";
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
  Triangle,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Extend Fabric.js object to include custom properties
interface ExtendedFabricObject extends FabricObject {
  isTemp?: boolean;
}

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  shortcut?: string;
}

const tools: Tool[] = [
  { id: "select", name: "Select", icon: MousePointer, shortcut: "V" },
  { id: "brush", name: "Brush", icon: Brush, shortcut: "B" },
  { id: "eraser", name: "Eraser", icon: Eraser, shortcut: "E" },
  { id: "line", name: "Line", icon: Minus, shortcut: "L" },
  { id: "rectangle", name: "Rectangle", icon: Square, shortcut: "R" },
  { id: "circle", name: "Circle", icon: CircleIcon, shortcut: "C" },
  { id: "triangle", name: "Triangle", icon: Triangle, shortcut: "T" },
  { id: "text", name: "Text", icon: Type, shortcut: "X" },
  { id: "move", name: "Pan", icon: Move, shortcut: "Space" },
];

const colorPresets = [
  "#000000", "#FFFFFF", "#C0C0C0", "#808080", "#800000", "#FF0000",
  "#800080", "#FF00FF", "#000080", "#0000FF", "#008080", "#00FFFF",
  "#008000", "#00FF00", "#808000", "#FFFF00", "#FFA500", "#964B00",
  "#FFC0CB", "#FF69B4", "#DDA0DD", "#9370DB", "#87CEEB", "#98FB98",
  "#F0E68C", "#FFE4B5", "#FFDAB9", "#D2691E", "#A0522D", "#8B4513"
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
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasFill, setHasFill] = useState(false);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight - 120, // More space for top toolbar
      backgroundColor: "#ffffff",
      selection: activeTool === "select",
    });

    // Initialize drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = strokeColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    // Add event listeners for drawing completion
    canvas.on('path:created', () => {
      setTimeout(saveState, 10);
    });

    // Mouse events for shape drawing
    canvas.on('mouse:down', (e) => {
      if (['line', 'rectangle', 'circle', 'triangle'].includes(activeTool)) {
        setIsDrawing(true);
        const pointer = canvas.getPointer(e.e);
        setStartPoint({ x: pointer.x, y: pointer.y });
      } else if (activeTool === 'text') {
        const pointer = canvas.getPointer(e.e);
        const text = new FabricText('Double click to edit', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Arial',
          fontSize: 20,
          fill: strokeColor,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        setTimeout(saveState, 10);
      }
    });

    canvas.on('mouse:move', (e) => {
      if (!isDrawing || !startPoint) return;
      
      const pointer = canvas.getPointer(e.e);
      
      // Remove the preview shape if it exists
      const objects = canvas.getObjects() as ExtendedFabricObject[];
      const lastObject = objects[objects.length - 1];
      if (lastObject && lastObject.isTemp) {
        canvas.remove(lastObject);
      }

      // Create preview shape
      let shape: any = null;
      
      switch (activeTool) {
        case 'line':
          shape = new Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            fill: '',
            opacity: opacity / 100,
          });
          break;
        case 'rectangle':
          shape = new Rect({
            left: Math.min(startPoint.x, pointer.x),
            top: Math.min(startPoint.y, pointer.y),
            width: Math.abs(pointer.x - startPoint.x),
            height: Math.abs(pointer.y - startPoint.y),
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            fill: hasFill ? fillColor : 'transparent',
            opacity: opacity / 100,
          });
          break;
        case 'circle':
          const radius = Math.sqrt(Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)) / 2;
          shape = new Circle({
            left: startPoint.x - radius,
            top: startPoint.y - radius,
            radius: radius,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            fill: hasFill ? fillColor : 'transparent',
            opacity: opacity / 100,
          });
          break;
        case 'triangle':
          const triangleWidth = pointer.x - startPoint.x;
          const triangleHeight = pointer.y - startPoint.y;
          const points = [
            { x: startPoint.x + triangleWidth / 2, y: startPoint.y },
            { x: startPoint.x + triangleWidth, y: startPoint.y + triangleHeight },
            { x: startPoint.x, y: startPoint.y + triangleHeight }
          ];
          shape = new Polygon(points, {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            fill: hasFill ? fillColor : 'transparent',
            opacity: opacity / 100,
          });
          break;
      }

      if (shape) {
        (shape as ExtendedFabricObject).isTemp = true;
        canvas.add(shape);
        canvas.renderAll();
      }
    });

    canvas.on('mouse:up', () => {
      if (isDrawing) {
        setIsDrawing(false);
        setStartPoint(null);
        
        // Finalize the shape
        const objects = canvas.getObjects() as ExtendedFabricObject[];
        const lastObject = objects[objects.length - 1];
        if (lastObject && lastObject.isTemp) {
          lastObject.isTemp = false;
          setTimeout(saveState, 10);
        }
      }
    });

    setFabricCanvas(canvas);
    saveState();

    // Resize handler
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 120,
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
    const isDrawingMode = activeTool === "brush" || activeTool === "eraser";
    fabricCanvas.isDrawingMode = isDrawingMode;
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
    
    // Filter out temporary objects before saving state
    const objects = fabricCanvas.getObjects() as ExtendedFabricObject[];
    const nonTempObjects = objects.filter(obj => !obj.isTemp);
    
    const state = JSON.stringify({
      ...fabricCanvas.toJSON(),
      objects: nonTempObjects
    });
    
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
    toast.success(`${toolId.charAt(0).toUpperCase() + toolId.slice(1)} tool selected`);
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
    link.download = "drawing.png";
    link.href = dataURL;
    link.click();
    
    toast.success("Image saved!");
  };

  const handleZoom = (direction: "in" | "out" | "reset") => {
    if (!fabricCanvas) return;
    
    let newZoom = zoom;
    if (direction === "in") newZoom = Math.min(zoom + 25, 400);
    else if (direction === "out") newZoom = Math.max(zoom - 25, 25);
    else newZoom = 100;
    
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom / 100);
    fabricCanvas.renderAll();
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
      {/* MS Paint Style Top Toolbar */}
      <div className="bg-canvas-panel border-b border-canvas-border">
        {/* File Menu Bar */}
        <div className="h-8 flex items-center px-2 text-sm border-b border-canvas-border">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">File</Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Edit</Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">View</Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Image</Button>
        </div>

        {/* Main Toolbar */}
        <div className="p-2 space-y-2">
          {/* Tools Row */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 p-1 bg-canvas-surface rounded border border-canvas-border">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    variant={activeTool === tool.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToolClick(tool.id)}
                    className={cn(
                      "h-8 w-8 p-0",
                      activeTool === tool.id && "bg-canvas-active hover:bg-canvas-active"
                    )}
                    title={`${tool.name} ${tool.shortcut ? `(${tool.shortcut})` : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-canvas-border mx-2" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={clearCanvas} className="h-8 px-2">
                <FileText className="w-4 h-4 mr-1" />
                New
              </Button>
              <Button variant="ghost" size="sm" onClick={saveImage} className="h-8 px-2">
                <Download className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={undo} disabled={historyStep <= 0} className="h-8 px-2">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={redo} disabled={historyStep >= history.length - 1} className="h-8 px-2">
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-canvas-border mx-2" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleZoom("out")} className="h-8 px-2">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-canvas-text-muted min-w-[40px] text-center">
                {zoom}%
              </span>
              <Button variant="ghost" size="sm" onClick={() => handleZoom("in")} className="h-8 px-2">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleZoom("reset")} className="h-8 px-2 text-xs">
                100%
              </Button>
            </div>
          </div>

          {/* Color and Brush Settings Row */}
          <div className="flex items-center gap-4">
            {/* Color Palette */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-canvas-text-muted">Colors:</span>
              <div className="grid grid-cols-10 gap-1">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={cn(
                      "w-5 h-5 border transition-all hover:scale-110",
                      strokeColor === color ? "border-2 border-canvas-active shadow-canvas-glow" : "border border-canvas-border"
                    )}
                    style={{ backgroundColor: color }}
                    title={`Select ${color}`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-6 h-6 border-2 border-canvas-border rounded cursor-pointer ml-2"
                title="Custom color"
              />
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-canvas-border" />

            {/* Brush Settings */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-canvas-text-muted">Size:</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs w-6 text-center">{strokeWidth}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-canvas-text-muted">Fill:</span>
                <Button
                  variant={hasFill ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setHasFill(!hasFill)}
                  className="h-6 px-2 text-xs"
                >
                  {hasFill ? "ON" : "OFF"}
                </Button>
                {hasFill && (
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="w-6 h-6 border border-canvas-border rounded cursor-pointer"
                    title="Fill color"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-canvas-text-muted">Opacity:</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs w-8 text-center">{opacity}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-canvas-surface flex items-center justify-center p-4">
        <div className="bg-white shadow-canvas-strong rounded border border-canvas-border">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-canvas-panel border-t border-canvas-border flex items-center px-2 text-xs text-canvas-text-muted">
        <span>Tool: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}</span>
        <div className="mx-2">|</div>
        <span>Zoom: {zoom}%</span>
        <div className="mx-2">|</div>
        <span>Ready</span>
      </div>
    </div>
  );
};