# Data Structure Visualizer

An interactive web-based visualization tool for core data structures and algorithms. Built with pure HTML, CSS, and JavaScript - no frameworks or build tools required.

## Features

### 1. Binary Heap
- **Insert**: Add values to the heap with automatic heapify-up
- **Delete**: Extract min/max with automatic heapify-down
- **Visualization**: Both tree and array representations
- **Types**: Min Heap and Max Heap support

### 2. AVL Tree
- **Insert**: Add nodes with automatic balancing
- **Delete**: Remove nodes with automatic rebalancing
- **Rotations**: Visual representation of LL, RR, LR, RL rotations
- **Balance Factors**: Display height and balance factor for each node

### 3. Graph & Algorithms
- **Graph Representation**: Adjacency list with weighted edges
- **Node Management**: Add/remove nodes and edges
- **BFS**: Breadth-First Search with queue visualization
- **DFS**: Depth-First Search with stack visualization
- **Dijkstra's Algorithm**: Shortest path algorithm with priority queue updates
- **Prim's Algorithm**: Minimum Spanning Tree construction

### 4. Hash Table
- **Collision Handling**: 
  - Chaining (separate chaining)
  - Linear Probing (open addressing)
- **Operations**: Insert, Search, Delete
- **Visualization**: Real-time display of hash table state

## Project Structure

```
data-structure-visualizer/
│── index.html      # Main HTML structure
│── style.css       # Styling and layout
│── app.js          # All data structure implementations
│── README.md       # This file
```

## How to Use

### Local Development

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd data-structure-visualizer
   ```

2. **Open with Live Server (Recommended)**
   - Install the "Live Server" extension in VS Code
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - The website will open in your browser

3. **Or simply open the file**
   - Double-click `index.html` to open in your default browser
   - Note: Some features may be limited when opening directly

### Using the Visualizer

1. **Navigate between data structures** using the tabs at the top
2. **Enter values** in the input fields
3. **Click operation buttons** to perform actions
4. **Watch the animations** and read the operation log for step-by-step explanations
5. **Use the clear button** to reset any data structure

## Deployment

### GitHub Pages (Recommended)

1. **Create a GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Data Structure Visualizer"
   git branch -M main
   git remote add origin https://github.com/yourusername/data-structure-visualizer.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click on "Settings"
   - Scroll down to "Pages" section
   - Under "Source", select "main" branch
   - Click "Save"
   - Your site will be available at: `https://yourusername.github.io/data-structure-visualizer/`

3. **Update repository name (if needed)**
   - If your repository name is different, update the URL accordingly
   - GitHub Pages URL format: `https://username.github.io/repository-name/`

### Netlify

1. **Drag and drop deployment**
   - Go to [Netlify](https://www.netlify.com/)
   - Sign up or log in
   - Drag and drop the `data-structure-visualizer` folder
   - Your site will be live instantly!

2. **Git-based deployment**
   - Connect your GitHub repository to Netlify
   - Netlify will automatically deploy on every push

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd data-structure-visualizer
   vercel
   ```

3. **Follow the prompts** to complete deployment

## Technical Details

### Technologies Used
- **HTML5**: Structure and semantic markup
- **CSS3**: Styling, animations, and responsive design
- **JavaScript (ES6+)**: All algorithms and visualizations
- **Canvas API**: Drawing and rendering visualizations

### Browser Compatibility
- Chrome/Edge (Recommended)
- Firefox
- Safari
- Opera

### No Dependencies
This project uses zero external libraries or frameworks. Everything is built from scratch using vanilla JavaScript.

## Features in Detail

### Animation System
- Step-by-step animations for all algorithms
- Color-coded highlighting for visited nodes/edges
- Real-time state updates
- Operation log with timestamps

### User Interface
- Clean, modern design
- Responsive layout (works on mobile devices)
- Intuitive controls
- Real-time feedback

### Code Quality
- Well-commented code
- Modular structure
- Efficient algorithms
- Error handling

## Project Requirements Met

✅ **Binary Heap**: Insert, Delete, Heapify Up/Down, Array + Tree visualization  
✅ **AVL Tree**: Insert, Delete, All rotations (LL, RR, LR, RL), Height and balance factors  
✅ **Graph**: Adjacency list, BFS, DFS, Dijkstra's, Prim's MST  
✅ **Hash Table**: Chaining and Linear Probing, Insert, Search, Delete, Collision handling  
✅ **UI**: Clean layout, inputs, buttons, canvas visualization  
✅ **Animations**: Step-by-step, highlighting, real-time state  
✅ **Log Panel**: Text descriptions of each operation  
✅ **Deployment Ready**: Works with GitHub Pages, Netlify, Vercel  

## Screenshots

*Add screenshots of your visualizer here*

## Future Enhancements

- [ ] Speed control for animations
- [ ] Step-by-step mode (pause/play)
- [ ] Export visualizations as images
- [ ] Additional algorithms (Kruskal's MST, A*, etc.)
- [ ] Dark mode theme
- [ ] Tutorial mode for beginners

## License

This project is open source and available for educational purposes.

## Author

[Your Name]

## Acknowledgments

- Course: Data Structures
- Project Type: Web-Based Portfolio Project

---

**Note**: This project is designed to be portfolio-ready and suitable for LinkedIn showcasing. All code is original and built from scratch.

