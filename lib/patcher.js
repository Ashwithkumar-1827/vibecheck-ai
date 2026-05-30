/**
 * Resiliently replaces buggy original code with patched code.
 * Strips trace markers (like '>') and falls back to indent-preserving
 * single-line replacement if direct matches fail.
 */
function resilientReplace(fileContent, originalCode, patchedCode) {
  // Normalize line endings to match the fileContent
  const hasCrLf = fileContent.includes('\r\n');
  const normalize = (txt) => {
    if (hasCrLf) {
      return txt.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
    } else {
      return txt.replace(/\r\n/g, '\n');
    }
  };

  const normOriginal = normalize(originalCode);
  const normPatched = normalize(patchedCode);

  // Helper to normalize trailing colons on python def/class lines
  const normalizeColons = (content) => {
    return content
      .replace(/(def\s+\w+\(.*?\))\s*:+/g, '$1:')
      .replace(/(class\s+\w+(?:\(.*?\))?)\s*:+/g, '$1:');
  };

  // 1. Try direct exact match replacement
  if (fileContent.includes(normOriginal)) {
    let replaced = fileContent.replace(normOriginal, normPatched);
    return normalizeColons(replaced);
  }

  // 2. Strip traceback prefix markers (e.g. "> " or ">") from lines
  const cleanLine = (line) => line.replace(/^>\s*/, '');
  
  const cleanOriginal = normalize(originalCode.split('\n').map(cleanLine).join('\n'));
  const cleanPatched = normalize(patchedCode.split('\n').map(cleanLine).join('\n'));

  if (fileContent.includes(cleanOriginal)) {
    console.log("[Resilient Patcher] Success: Matched after stripping traceback indicators ('>')");
    let replaced = fileContent.replace(cleanOriginal, cleanPatched);
    return normalizeColons(replaced);
  }

  // 3. Fallback: Indentation-agnostic, comment-agnostic, case-insensitive, fuzzy block matcher
  const normalizeLineFuzzy = (line) => {
    return line
      .replace(/^>\s*/, '')          // strip traceback indicators
      .replace(/#.*$/, '')           // strip python comments
      .replace(/\/\/.*$/, '')        // strip js comments
      .replace(/\s+/g, '')           // strip all whitespace
      .toLowerCase();                // lowercase
  };

  const fuzzySearchLines = originalCode.split(/\r?\n/).map(normalizeLineFuzzy).filter(l => l);
  
  if (fuzzySearchLines.length > 0) {
    const fileLines = fileContent.split(/\r?\n/);
    const fuzzyFileLines = fileLines.map(normalizeLineFuzzy);
    
    let matchStartIndex = -1;
    let matchEndIndex = -1;
    
    for (let i = 0; i <= fuzzyFileLines.length - fuzzySearchLines.length; i++) {
      let match = true;
      let fileIdx = i;
      let searchIdx = 0;
      
      while (searchIdx < fuzzySearchLines.length && fileIdx < fuzzyFileLines.length) {
        // Skip empty or comment-only lines in file during matching
        while (fileIdx < fuzzyFileLines.length && !fuzzyFileLines[fileIdx]) {
          fileIdx++;
        }
        
        if (fileIdx >= fuzzyFileLines.length) {
          match = false;
          break;
        }
        
        if (fuzzyFileLines[fileIdx] !== fuzzySearchLines[searchIdx]) {
          match = false;
          break;
        }
        
        fileIdx++;
        searchIdx++;
      }
      
      if (match && searchIdx === fuzzySearchLines.length) {
        matchStartIndex = i;
        matchEndIndex = fileIdx - 1;
        break;
      }
    }
    
    if (matchStartIndex !== -1 && matchEndIndex !== -1) {
      console.log(`[Resilient Patcher] Success: Fuzzy contiguous block matched from line ${matchStartIndex + 1} to ${matchEndIndex + 1}`);
      const baseLeadingWhitespace = fileLines[matchStartIndex].match(/^\s*/)[0];
      
      const patchLines = patchedCode.split(/\r?\n/).map(cleanLine);
      let patchBaseIndent = 0;
      for (const line of patchLines) {
        if (line.trim()) {
          patchBaseIndent = line.match(/^\s*/)[0].length;
          break;
        }
      }
      
      const adjustedPatchLines = patchLines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        const currentIndent = line.match(/^\s*/)[0].length;
        const relativeIndent = currentIndent - patchBaseIndent;
        return baseLeadingWhitespace + " ".repeat(Math.max(0, relativeIndent)) + trimmed;
      });
      
      fileLines.splice(matchStartIndex, matchEndIndex - matchStartIndex + 1, ...adjustedPatchLines);
      let replaced = fileLines.join(hasCrLf ? '\r\n' : '\n');
      return normalizeColons(replaced);
    }
  }

  // 4. Fallback: Search for function or class definition block and replace the whole block
  const blockMatch = originalCode.match(/^\s*(def|class)\s+(\w+)\b/m) || patchedCode.match(/^\s*(def|class)\s+(\w+)\b/m);
  if (blockMatch) {
    const blockType = blockMatch[1];
    const blockName = blockMatch[2];
    const fileLines = fileContent.split(/\r?\n/);
    let blockStartIndex = -1;
    let blockLeadingWhitespace = "";
    
    for (let i = 0; i < fileLines.length; i++) {
      const m = fileLines[i].match(new RegExp(`^(\\s*)${blockType}\\s+${blockName}\\b`));
      if (m) {
        blockStartIndex = i;
        blockLeadingWhitespace = m[1];
        break;
      }
    }
    
    if (blockStartIndex !== -1) {
      console.log(`[Resilient Patcher] Success: Matched "${blockType} ${blockName}" signature block at line ${blockStartIndex + 1}`);
      const baseIndent = blockLeadingWhitespace.length;
      let blockEndIndex = blockStartIndex;
      
      for (let i = blockStartIndex + 1; i < fileLines.length; i++) {
        const line = fileLines[i];
        if (line.trim()) {
          const indent = line.match(/^\s*/)[0].length;
          if (indent <= baseIndent) {
            break;
          }
        }
        blockEndIndex = i;
      }
      
      const patchLines = patchedCode.split(/\r?\n/).map(cleanLine);
      let patchBaseIndent = 0;
      for (const line of patchLines) {
        if (line.trim()) {
          patchBaseIndent = line.match(/^\s*/)[0].length;
          break;
        }
      }
      
      const adjustedPatchLines = patchLines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        const currentIndent = line.match(/^\s*/)[0].length;
        const relativeIndent = currentIndent - patchBaseIndent;
        return blockLeadingWhitespace + " ".repeat(Math.max(0, relativeIndent)) + trimmed;
      });
      
      fileLines.splice(blockStartIndex, blockEndIndex - blockStartIndex + 1, ...adjustedPatchLines);
      let replaced = fileLines.join(hasCrLf ? '\r\n' : '\n');
      return normalizeColons(replaced);
    }
  }

  // 5. Fallback: If originalCode is 1 line, try exact line replace
  const cleanOrigLines = originalCode.split(/\r?\n/).map(cleanLine).map(l => l.trim()).filter(l => l);
  if (cleanOrigLines.length === 1) {
    const origTarget = cleanOrigLines[0];
    const fileLines = fileContent.split(/\r?\n/);
    for (let i = 0; i < fileLines.length; i++) {
      if (fileLines[i].includes(origTarget)) {
        console.log(`[Resilient Patcher] Success: Fallback exact single-line match at line ${i+1}`);
        const baseIndent = fileLines[i].match(/^\s*/)[0];
        fileLines[i] = baseIndent + patchedCode.trim();
        let replaced = fileLines.join(hasCrLf ? '\r\n' : '\n');
        return normalizeColons(replaced);
      }
    }
  }

  // 6. Smarter fallback: Sliding-window line-by-line similarity scorer.
  //    Finds the block in the file with the highest percentage of matching lines
  //    to the originalCode, preventing silent full-file corruption.
  const origLinesNorm = originalCode.split(/\r?\n/).map(l => l.trim().toLowerCase()).filter(l => l);
  if (origLinesNorm.length > 0) {
    const fileLines = fileContent.split(/\r?\n/);
    const fileLinesNorm = fileLines.map(l => l.trim().toLowerCase());
    const windowSize = origLinesNorm.length;
    
    let bestScore = 0;
    let bestStart = -1;
    let bestEnd = -1;
    
    for (let i = 0; i <= fileLinesNorm.length - windowSize; i++) {
      let matches = 0;
      for (let j = 0; j < windowSize; j++) {
        if (fileLinesNorm[i + j] === origLinesNorm[j]) {
          matches++;
        }
      }
      const score = matches / windowSize;
      if (score > bestScore) {
        bestScore = score;
        bestStart = i;
        bestEnd = i + windowSize - 1;
      }
    }
    
    // Also try with a flexible window (±2 lines) for off-by-one situations
    for (let delta = -2; delta <= 2; delta++) {
      const adjustedSize = windowSize + delta;
      if (adjustedSize <= 0 || adjustedSize > fileLinesNorm.length) continue;
      for (let i = 0; i <= fileLinesNorm.length - adjustedSize; i++) {
        let matches = 0;
        const checkSize = Math.min(adjustedSize, origLinesNorm.length);
        for (let j = 0; j < checkSize; j++) {
          if (fileLinesNorm[i + j] === origLinesNorm[j]) {
            matches++;
          }
        }
        const score = matches / origLinesNorm.length;
        if (score > bestScore) {
          bestScore = score;
          bestStart = i;
          bestEnd = i + adjustedSize - 1;
        }
      }
    }
    
    // Only apply if we have a reasonable confidence match (>40% lines match)
    if (bestScore >= 0.4 && bestStart !== -1) {
      console.log(`[Resilient Patcher] Success: Similarity-scored block match (${(bestScore * 100).toFixed(0)}% confidence) from line ${bestStart + 1} to ${bestEnd + 1}`);
      const baseLeadingWhitespace = fileLines[bestStart].match(/^\s*/)[0];
      
      const patchLines = patchedCode.split(/\r?\n/).map(cleanLine);
      let patchBaseIndent = 0;
      for (const line of patchLines) {
        if (line.trim()) {
          patchBaseIndent = line.match(/^\s*/)[0].length;
          break;
        }
      }
      
      const adjustedPatchLines = patchLines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        const currentIndent = line.match(/^\s*/)[0].length;
        const relativeIndent = currentIndent - patchBaseIndent;
        return baseLeadingWhitespace + " ".repeat(Math.max(0, relativeIndent)) + trimmed;
      });
      
      fileLines.splice(bestStart, bestEnd - bestStart + 1, ...adjustedPatchLines);
      let replaced = fileLines.join(hasCrLf ? '\r\n' : '\n');
      return normalizeColons(replaced);
    }
  }

  // If all strategies failed, throw an actionable error instead of silently corrupting the file
  throw new Error("Resilient patcher could not find a safe match in the file. The AI-generated originalCode does not match any block in the actual file. Please review the patch manually or re-run diagnosis.");
}

module.exports = {
  resilientReplace
};
