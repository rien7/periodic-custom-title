# Periodic Custom Title

Periodic Custom Title is an Obsidian plugin that enhances the journaling experience by providing advanced title formatting for periodic notes and a convenient calendar navigation system.

## Features

- **Custom Title Formatting**: Format titles for daily, weekly, monthly, and yearly notes
- **Relative Date Indicators**: Add colored indicators for today, yesterday, tomorrow, etc.
- **Calendar Navigation**: Navigate between notes with an intuitive calendar interface
- **Multi-language Support**: Full support for different locales and first day of week settings

## Usage

### Title Formatting

Better Journal allows you to customize how your periodic note titles are displayed:
- Configure date formats using Moment.js syntax
- Add special formatting for dates not in the current year
- Set up relative date indicators with custom text and colors

### Navigation

The plugin adds a navigation bar next to your note titles:
- Navigate to previous/next notes with arrow buttons
- Open a calendar view to jump to specific dates
- Calendar highlights days that have existing notes

## Configuration

In the plugin settings, you can:
1. Set your preferred language
2. Choose the first day of the week (Sunday or Monday)
3. Configure title formatting for each note type:
   - Date format (with Moment.js syntax)
   - Special format for dates not in the current year
   - Separator between date parts
   - Position for relative indicators (before or after date)
   - Relative date settings (format: diff | text | color)

## Examples

Configure relative date settings with:
```
0 | Today | green
-1 | Yesterday | orange
1 | Tomorrow | blue
```

This will show "Today" in green for today's note, "Yesterday" in orange for yesterday's note, etc.
