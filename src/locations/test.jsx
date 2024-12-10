import React, { useState, useEffect } from 'react';
import { Paragraph, TextInput, Menu, IconButton, Button } from '@contentful/f36-components';
import { MoreVerticalIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';

const Sidebar = () => {
  const sdk = useSDK();
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedWorkItem, setSearchedWorkItem] = useState(null);

  const fetchWorkItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/work-items');
      if (!response.ok) {
        throw new Error('Failed to fetch work items');
      }
      const data = await response.json();
      setWorkItems(data);
    } catch (error) {
      setError(error.message || 'Error fetching work items');
    } finally {
      setLoading(false);
    }
  };

  // Handle search action
  // const handleSearch = async (e) => {
  //   if (e.key === 'Enter') {
  //     const foundItem = workItems.find(
  //       (item) => item.fields["System.Title"] && item.fields["System.Title"].toLowerCase().includes(searchTerm.toLowerCase())
  //     );

  //     if (foundItem) {
  //       setSearchedWorkItem(foundItem);
  //       setError(null); // Reset the error state
  //     } else {
  //       setError("No work item found with that title.");
  //       setSearchedWorkItem(null);
  //     }

  //     setSearchTerm(''); // Clear the search term after the search
  //   }
  // };
  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      // Normalize both the search term and work item title to lowercase for case-insensitive comparison
      const foundItem = workItems.find(
        (item) => 
          item.fields["System.Title"] && 
          item.fields["System.Title"].toLowerCase() === searchTerm.toLowerCase() // Exact match, case-insensitive
      );
  
      if (foundItem) {
        setSearchedWorkItem(foundItem);
        setError(null); // Reset the error state
      } else {
        setError("No work item found with that title.");
        setSearchedWorkItem(null);
      }
  
      setSearchTerm(''); // Clear the search term after the search
    }
  };
  
  // Function to open work item in Azure DevOps
  const openInAzure = (workItemId) => {
    const azureUrl = `https://dev.azure.com/${process.env.REACT_APP_AZURE_DEVOPS_ORG}/${process.env.REACT_APP_AZURE_DEVOPS_PROJECT}/_workitems/edit/${workItemId}`;
    window.open(azureUrl, '_blank');  // Open in a new tab
  };

  // Function to unlink (clear the work item link)
  const unlinkWorkItem = () => {
    setSearchedWorkItem(null); // Clear the currently displayed work item details
  };

  useEffect(() => {
    fetchWorkItems(); // Fetch list of work items
  }, []);

  useEffect(() => {
    const savedWorkItemId = sdk.entry.fields.linkedWorkItem?.getValue();
    if (savedWorkItemId && workItems.length > 0) {
      const foundItem = workItems.find(item => item.id.toString() === savedWorkItemId.toString());
      if (foundItem) {
        setSearchedWorkItem(foundItem);
      }
    }
  }, [workItems]);

  if (loading) {
    return <Paragraph>Loading...</Paragraph>;
  }

  return (
    <div>
      {!searchedWorkItem ? (
        <div>
          <TextInput
            placeholder="Search by Title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
          {error && <Paragraph style={{ color: 'red' }}>{error}</Paragraph>}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Work Item Details</h3>
            <Menu>
              <Menu.Trigger>
                <IconButton
                  variant="transparent"
                  icon={<MoreVerticalIcon />}
                  aria-label="Actions"
                />
              </Menu.Trigger>
              <Menu.List>
                {/* Open in Azure */}
                <Menu.Item onClick={() => openInAzure(searchedWorkItem.id)}>
                  Open in Azure
                </Menu.Item>
                {/* Unlink */}
                <Menu.Item onClick={unlinkWorkItem}>
                  Unlink
                </Menu.Item>
              </Menu.List>
            </Menu>
          </div>
          <p><strong>Title:</strong> {searchedWorkItem.fields["System.Title"]}</p>
          <p><strong>Assigned To:</strong> {searchedWorkItem.fields["System.AssignedTo"]?.displayName || "Unassigned"}</p>
          <p><strong>State:</strong> {searchedWorkItem.fields["System.State"]}</p>
          <p><strong>Created By:</strong> {searchedWorkItem.fields["System.CreatedBy"]?.displayName || "Unknown"}</p>
          <p><strong>Created Date:</strong> {searchedWorkItem.fields["System.CreatedDate"] ? new Date(searchedWorkItem.fields["System.CreatedDate"]).toLocaleString() : "N/A"}</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
