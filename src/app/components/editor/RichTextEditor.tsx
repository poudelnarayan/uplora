import { useState, useRef, useEffect } from "react";
import { 
  Bold, 
  Italic, 
  Hash, 
  AtSign, 
  Link, 
  Heading1,
  Heading2,
  Undo,
  Redo
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  platforms?: Array<{ id: string; name: string; limit: number }>;
  selectedPlatforms?: string[];
  className?: string;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "What's on your mind?",
  platforms = [],
  selectedPlatforms = [],
  className = ""
}: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Save to history when content changes
  useEffect(() => {
    if (value !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(value);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [value]);

  const insertFormatting = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText;
    let newCursorPos;
    
    if (selectedText) {
      // Wrap selected text
      newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
      newCursorPos = start + before.length + selectedText.length + after.length;
    } else {
      // Insert formatting markers with cursor between
      newText = value.substring(0, start) + before + after + value.substring(end);
      newCursorPos = start + before.length;
    }
    
    onChange(newText);
    
    // Set cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertSimpleText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = value.substring(0, start) + text + value.substring(end);
    const newCursorPos = start + text.length;
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatText = (type: string) => {
    switch (type) {
      case "bold":
        insertFormatting("**", "**");
        break;
      case "italic":
        insertFormatting("*", "*");
        break;
      case "h1":
        insertFormatting("^", "^");
        break;
      case "h2":
        insertFormatting("^^", "^^");
        break;
      case "hashtag":
        insertSimpleText("#");
        break;
      case "mention":
        insertSimpleText("@");
        break;
      case "link":
        insertSimpleText("https://");
        break;
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Professional Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => formatText("bold")}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => formatText("italic")}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => formatText("h1")}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => formatText("h2")}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Social Elements */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => formatText("hashtag")}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
              title="Hashtag"
            >
              <Hash className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => formatText("mention")}
              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
              title="Mention"
            >
              <AtSign className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => formatText("link")}
              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
              title="Link"
            >
              <Link className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* History Controls */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={undo}
            disabled={historyIndex <= 0}
            className="h-8 w-8 p-0"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="h-8 w-8 p-0"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Textarea Editor */}
      <div className={`relative border-2 rounded-lg transition-all duration-200 ${
        isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-gray-200'
      }`}>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="min-h-[200px] text-base leading-relaxed resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Character Count - Outside text field */}
      {selectedPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end">
          {selectedPlatforms.map((platformId) => {
            const platform = platforms.find(p => p.id === platformId);
            if (!platform) return null;
            
            const count = value.length;
            const isOver = count > platform.limit;
            const isNearLimit = count > platform.limit * 0.8;
            
            return (
              <Badge 
                key={platformId}
                variant={isOver ? "destructive" : isNearLimit ? "secondary" : "outline"}
                className={`text-[10px] px-1.5 py-0.5 transition-all duration-200 ${
                  isOver 
                    ? "bg-red-100 text-red-800 border-red-300" 
                    : isNearLimit 
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                <span className="font-medium">{platform.name === "X (Twitter)" ? "X" : platform.name}</span>
                <span className="mx-1">•</span>
                <span className={isOver ? "font-bold" : ""}>{count}</span>
                <span className="opacity-75">/{platform.limit}</span>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;