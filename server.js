require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import cors

const app = express();
const { AZURE_DEVOPS_PAT, AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT, PORT = 3000 } = process.env;

// Validate required environment variables
if (!AZURE_DEVOPS_PAT || !AZURE_DEVOPS_ORG || !AZURE_DEVOPS_PROJECT) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// Enable CORS for all origins (You can adjust this for specific domains if needed)
app.use(cors());
app.use(express.json());

// Initialize Axios instance
const axiosInstance = axios.create({
  baseURL: `https://bofaz.visualstudio.com/${AZURE_DEVOPS_PROJECT}/_apis`,
  headers: {
    Authorization: `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64')}`,
  },
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Endpoint to fetch all work items with pagination and search filter
app.get('/work-items', async (req, res) => {
  const { searchTerm = '', page = 1, perPage = 50 } = req.query;
  try {
    const wiqlQuery = {
      query: `SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.Title] CONTAINS '${searchTerm}' ORDER BY [System.CreatedDate] DESC`
    };

    const queryResponse = await axiosInstance.post('/wit/wiql?api-version=7.1', wiqlQuery);
    const workItemIds = queryResponse.data.workItems
      .slice((page - 1) * perPage, page * perPage)
      .map(item => item.id);

    if (workItemIds.length > 0) {
      const workItemsResponse = await axiosInstance.get(
        `/wit/workitems?ids=${workItemIds.join(',')}&fields=System.Id,System.Title,System.State,System.AssignedTo,System.CreatedBy,System.CreatedDate&api-version=7.1`
      );
      res.json(workItemsResponse.data.value);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching work items:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch work items.' });
  }
});

// Endpoint to fetch a specific work item by its ID
app.get('/work-items/:id', async (req, res) => {
  const { id } = req.params; // Get work item ID from the request parameters
  try {
    const workItemResponse = await axiosInstance.get(
      `/wit/workitems/${id}?fields=System.Id,System.Title,System.State,System.AssignedTo,System.CreatedBy,System.CreatedDate&api-version=7.1`
    );
    res.json(workItemResponse.data);
  } catch (error) {
    console.error('Error fetching work item:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch work item.' });
  }
});

// Endpoint to fetch data from the "self" link of a work item
app.get('/work-items/fetch-self/:id', async (req, res) => {
  const { id } = req.params; // Get work item ID from the request parameters

  try {
    // Fetch the initial work item to get the `self` link
    const initialResponse = await axiosInstance.get(
      `/wit/workitems/${id}?fields=System.Id,System.Title,System.State&api-version=7.1`
    );

    const selfLink = initialResponse.data._links.self.href;

    // Fetch data from the `self` link
    const selfResponse = await axios.get(selfLink, {
      headers: {
        Authorization: `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64')}`,
      },
    });

    res.json(selfResponse.data); // Send the data back to the client
  } catch (error) {
    console.error('Error fetching data from self link:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch data from self link.' });
  }
});

