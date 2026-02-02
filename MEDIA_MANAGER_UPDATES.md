# Media Manager Updates - Image Editing Feature

## Summary
Successfully fixed button click issues and added image editing functionality to the Media Manager dropdown menu.

## Changes Made

### 1. **Fixed Button Click Issues** (MediaGrid.tsx)
**Problem:** The 3-dot menu and copy URL buttons were not responding to clicks.

**Root Cause:** Z-index conflict with the modal backdrop. The dropdown menu used `createPortal` to render to `document.body`, but had z-index values (10000/10001) that were lower than the modal wrapper (999999).

**Solution:**
- Increased dropdown backdrop z-index: `10000` → `1000000`
- Increased dropdown menu z-index: `10001` → `1000001`
- Added explicit `pointerEvents: 'auto'` to button container and buttons
- Removed debug alerts and console.logs

### 2. **Added Image Editing Feature**

#### Provider Changes (MediaManagerProvider.tsx)
**New State:**
- `editingMediaId: string | null` - Tracks which media item is being re-edited

**New Function:**
- `editMediaImage(media: MediaItem)` - Downloads an existing media item's image, converts it to a File object, and opens it in the ImageEditor

**Modified Function:**
- `uploadEditedFile()` - Now checks if we're updating an existing media item or uploading a new one:
  - If `editingMediaId` is set → PATCH request to `/api/media/{id}` (update)
  - If `editingMediaId` is null → POST request to `/api/media` (create new)

#### UI Changes (MediaGrid.tsx)
**New Dropdown Option:**
- "Edit Image" button in the 3-dot menu (only visible for image files)
- Uses purple accent color to match the theme
- Opens the ImageEditor with the downloaded image
- When saved, updates the existing media item instead of creating a new one

## How It Works

### Image Edit Flow:
1. User clicks 3-dot menu on an image
2. User clicks "Edit Image"
3. System downloads the image from its URL
4. Converts the downloaded blob to a File object
5. Sets `editingFile` and `editingMediaId` in state
6. ImageEditor opens with the file
7. User crops/rotates the image
8. User clicks save
9. System sends PATCH request to update the existing media item
10. Grid refreshes to show updated image

### Benefits:
- ✅ Can re-edit uploaded images
- ✅ Maintains original media ID (no duplicates)
- ✅ Preserves metadata (tags, alt text, etc.)
- ✅ Updates all references automatically
- ✅ Toast notifications for user feedback

## Technical Details

### Z-Index Hierarchy (Fixed):
```
Modal Wrapper:         999,999
  ↳ Backdrop:          1 (relative)
  ↳ Modal Container:   2 (relative)
    ↳ MediaGrid:       (no z-index)
      ↳ Grid Items:    (relative)
        ↳ Buttons:     9,999 (within card context)

Portaled Dropdown:     1,000,000 (backdrop) + 1,000,001 (menu)
```

### API Endpoints Used:
- `GET /api/media` - Fetch media list
- `POST /api/media` - Upload new media (with file)
- `PATCH /api/media/{id}` - Update existing media (with file)
- `DELETE /api/media/{id}` - Delete media

## Testing Checklist
- [x] Copy URL button works
- [x] 3-dot menu opens
- [x] Move to folder works
- [x] Edit Image option appears for images only
- [x] Edit Image downloads and opens ImageEditor
- [x] Saving edited image updates the original
- [x] Grid refreshes after update
- [x] Toast notifications display correctly
- [x] No TypeScript errors
- [x] Lint passes (only warnings, no errors)

## Files Modified
1. `src/components/admin/media-manager/MediaGrid.tsx`
2. `src/components/admin/media-manager/MediaManagerProvider.tsx`

## Notes
- The Image Editor only supports images (checked via `item.mimeType?.startsWith('image/')`)
- Downloaded images maintain their original filename and mime type
- The edit flow reuses the existing ImageEditor component (no new components needed)
- Metadata (alt text, tags, etc.) is preserved during image updates
