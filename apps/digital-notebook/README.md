# Digital Notebook

A dynamic, real-time digital notebook web application built with vanilla JavaScript and Firebase Realtime Database. Perfect for organizing your learning notes, code snippets, and study materials.

## Features

### 🎯 Core Functionality
- **Topics & Subtopics**: Create hierarchical organization with topics and their subtopics
- **Rich Content Support**: Add descriptions, notes, bullet points, and code snippets
- **Real-time Sync**: All changes are automatically saved to Firebase and synced across devices
- **Search Functionality**: Search through all topics, subtopics, notes, and code
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### 📝 Content Types
- **Text Notes**: Write detailed descriptions and notes
- **Bullet Points**: Create organized lists with custom bullet points
- **Code Snippets**: Add code with syntax highlighting for 20+ programming languages
- **Rich Formatting**: Automatic line breaks and proper text formatting

### 🔧 Technical Features
- **Firebase Integration**: Uses Firebase Realtime Database for data persistence
- **Unique Node Names**: Prevents conflicts with other projects in your Firebase database
- **Real-time Updates**: Changes appear instantly across all connected devices
- **Offline Support**: Basic offline functionality with local caching
- **Modern UI**: Beautiful, intuitive interface with smooth animations

## Database Structure

The application uses very unique node names to avoid conflicts with other projects:

```
digital_notebook_2024_v1/
├── digital_notebook_topics_2024_v1/
│   ├── topicId1/
│   │   ├── title: "JavaScript Basics"
│   │   ├── description: "Fundamental concepts"
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   └── topicId2/
│       └── ...
└── digital_notebook_subtopics_2024_v1/
    ├── subtopicId1/
    │   ├── title: "Variables"
    │   ├── description: "Variable declaration"
    │   ├── notes: "Detailed notes..."
    │   ├── bulletPoints: ["Point 1", "Point 2"]
    │   ├── code: "let x = 10;"
    │   ├── language: "javascript"
    │   ├── topicId: "topicId1"
    │   ├── createdAt: timestamp
    │   └── updatedAt: timestamp
    └── subtopicId2/
        └── ...
```

## Supported Programming Languages

The code editor supports syntax highlighting for:
- JavaScript, TypeScript, React JSX
- HTML, CSS
- Python, Java, C++, C#
- PHP, SQL, Bash
- JSON, XML, Markdown
- Vue, Go, Rust, Swift, Kotlin

## How to Use

### Getting Started
1. Open `index.html` in your web browser
2. Click "Add Your First Topic" or "Add Topic" button
3. Enter a topic title and optional description
4. Start adding subtopics to organize your content

### Adding Content
1. **Topics**: Click "Add Topic" in the sidebar
2. **Subtopics**: Select a topic, then click "Add Subtopic"
3. **Notes**: Use the notes field for detailed explanations
4. **Bullet Points**: Enter one point per line in the bullet points field
5. **Code**: Paste your code and select the appropriate language

### Managing Content
- **Edit**: Click the edit button (pencil icon) on any topic or subtopic
- **Delete**: Click the delete button (trash icon) to remove items
- **Search**: Use the search bar to find specific content
- **Navigate**: Click on topics in the sidebar to switch between them

### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save current form (when in edit mode)
- `Escape`: Close modals
- `Enter`: Submit forms

## File Structure

```
digital-notebook/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

## Firebase Configuration

The application is pre-configured with your Firebase project:
- **Project ID**: portfolio-415e1
- **Database**: Realtime Database (Asia Southeast 1)
- **Version**: Firebase 8.10.1

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features

- **Lazy Loading**: Content loads as needed
- **Efficient Queries**: Optimized Firebase database queries
- **Minimal DOM Updates**: Smart rendering to avoid unnecessary re-renders
- **Debounced Search**: Search input is debounced for better performance

## Security Considerations

- **XSS Protection**: All user input is properly escaped
- **Firebase Rules**: Ensure your Firebase database rules are properly configured
- **Input Validation**: Client-side validation for all form inputs

## Customization

### Styling
- Modify `styles.css` to change colors, fonts, and layout
- The app uses CSS custom properties for easy theming
- Responsive breakpoints are clearly defined

### Functionality
- Extend the `DigitalNotebook` class in `script.js`
- Add new content types by modifying the form and rendering logic
- Customize the database structure (remember to update node names)

## Troubleshooting

### Common Issues

1. **Firebase not loading**
   - Check your internet connection
   - Verify Firebase configuration in the HTML file
   - Check browser console for errors

2. **Data not saving**
   - Ensure Firebase database rules allow write operations
   - Check browser console for permission errors
   - Verify the database URL is correct

3. **Search not working**
   - Clear browser cache
   - Check if JavaScript is enabled
   - Verify the search input field exists

### Debug Mode
Open browser console (F12) to see detailed logs and error messages.

## Future Enhancements

Potential features for future versions:
- Export/Import functionality
- Markdown support for notes
- Image uploads
- Collaborative editing
- Dark/Light theme toggle
- Advanced search filters
- Tags and categories
- Version history

## Contributing

This is a learning project, but feel free to:
- Report bugs or issues
- Suggest new features
- Improve the documentation
- Enhance the UI/UX

## License

This project is for educational purposes. Feel free to use and modify as needed.

---

**Happy Note-taking! 📚✨** 