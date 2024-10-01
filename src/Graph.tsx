import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    const elem: PerspectiveViewerElement = document.getElementsByTagName('perspective-viewer')[0] as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.

      // Add more Perspective configurations here.
      elem.load(this.table);

      // Configure the viewer with extra settings
      elem.setAttribute('view', 'y_line');  // You can choose how to visualize data (line chart, bar chart, etc.)
      elem.setAttribute('row-pivots', '["timestamp"]');  // Pivot the data by timestamp
      elem.setAttribute('columns', '["top_ask_price", "top_bid_price"]');  // Define the columns to display
      elem.setAttribute('aggregates', JSON.stringify({
        stock: 'distinct count',
        top_ask_price: 'avg',
        top_bid_price: 'avg',
        timestamp: 'distinct count'
      }));
    }
  }

  componentDidUpdate() {
    // Avoid inserting duplicate data entries into the Perspective table
    if (this.table) {
      const uniqueData = this.removeDuplicateEntries(this.props.data);
      
      // Insert the unique data into the Perspective table
      this.table.update(uniqueData.map((el: any) => {
        return {
          stock: el.stock,
          top_ask_price: (el.top_ask && el.top_ask.price) ? el.top_ask.price : 0,
          top_bid_price: (el.top_bid && el.top_bid.price) ? el.top_bid.price : 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }

  // Helper function to remove duplicate entries based on timestamp and stock
  removeDuplicateEntries(data: ServerRespond[]): ServerRespond[] {
    const uniqueData: { [key: string]: ServerRespond } = {};
    
    data.forEach((item) => {
      // Use a combination of stock and timestamp as the unique key
      const key = `${item.stock}-${item.timestamp}`;
      uniqueData[key] = item;
    });

    return Object.values(uniqueData);  // Return the array of unique data
  }
}

export default Graph;
