/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const formatLibraryName = (name: string) => {
  // Remove extension
  let cleanName = name.replace(/\.md$/i, '');
  // Replace separators with spaces
  cleanName = cleanName.replace(/[_-]/g, ' ');
  
  // If it's ALL CAPS, lowercase it first
  if (cleanName === cleanName.toUpperCase()) {
    cleanName = cleanName.toLowerCase();
  }

  // Convert to Title Case
  return cleanName
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
