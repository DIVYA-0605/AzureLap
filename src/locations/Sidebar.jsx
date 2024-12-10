import React, { useState, useEffect } from "react";
import { Spinner, Stack } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import SearchBar from "../components/SearchBar";
import WorkItemsGrid from "../components/WorkItemsGrid";
import WorkItemDetails from "../components/WorkItemDetails";

const Sidebar = () => {
  const sdk = useSDK();
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchedWorkItem, setSearchedWorkItem] = useState(null);
  // const [workItemDetailsError, setWorkItemDetailsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  const fetchWorkItems = async (searchTerm, page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/work-items?searchTerm=${searchTerm}&page=${page}&perPage=50`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch work items");
      }
      const data = await response.json();
      setWorkItems(data);
      // setTotalPages(Math.ceil(data.totalCount / 50));
      setCurrentPage(page);
      setError(null);
    } catch (error) {
      setError(error.message || "Error fetching work items");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setWorkItems([]); // Clear the work items when searchTerm is empty
      setError(null);   // Clear the error state
    }
  
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
  
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  useEffect(() => {
    if (debouncedSearchTerm.trim() !== "") {
      fetchWorkItems(debouncedSearchTerm, currentPage);
    } else {
      setWorkItems([]); // Ensure work items are cleared when the debounced term is empty
    }
  }, [debouncedSearchTerm, currentPage]);
    



  // const handlePageChange = (newPage) => {
  //   setCurrentPage(newPage);
  // };


  const fetchSelfLinkData = async (workItemId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/work-items/fetch-self/${workItemId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data from self link");
      }
      const data = await response.json();
      console.log("Data from self link:", data);
  
      // Extract releaseDate (adjust the key based on your actual API response)
      const releaseDate = data.fields?.["Custom.DateStamp_Release"] || null;
      return releaseDate;
    } catch (error) {
      console.error("Error fetching data from self link:", error.message || error);
      return null;
    }
  };
  const linkWorkItemToEntry = async (workItem) => {
    const entry = sdk.entry;
    const workItemField = entry.fields?.workItemId;
  
    if (!workItemField) {
      console.error("workItemId field is not available on this entry");
      return;
    }
  
    try {
      console.log("Work item received in linkWorkItemToEntry:", workItem);
  
      // Get the current value or initialize it as an empty array
      const workItemArray = workItemField.getValue() || [];
  
      // Extract ID, state, and release date
      const newWorkItem = {
        id: String(workItem.id),
        state: workItem.fields?.["System.State"] || "Unknown",
        releaseDate: workItem.releaseDate || null,
      };
  
      console.log("New work item to link:", newWorkItem);
  
      // Check if the work item is already in the array
      const alreadyLinked = workItemArray.some(
        (item) => item.id === newWorkItem.id
      );
  
      if (!alreadyLinked) {
        const updatedWorkItemArray = [...workItemArray, newWorkItem];
        workItemField.setValue(updatedWorkItemArray);
        await entry.save();
        console.log("Work item linked to Contentful entry as JSON!");
  
        // Update state to reflect the changes in the sidebar
        setWorkItems(updatedWorkItemArray); // Update the local workItems state
      } else {
        console.log("Work item is already linked to this entry.");
      }
  
      // Clear the search term and work items after linking
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to save work item to Contentful:", error);
    }
  };
  
  



const handleWorkItemClick = async (item) => {
  console.log("Work item clicked:", item);
  setSearchedWorkItem(item);

  // Fetch the release date
  const releaseDate = await fetchSelfLinkData(item.id);

  // Create an updated workItem object with the releaseDate
  const updatedWorkItem = {
    ...item,
    releaseDate: releaseDate,
  };

  console.log("Updated work item with release date:", updatedWorkItem);

  // Link the updated work item
  linkWorkItemToEntry(updatedWorkItem);
};

  
  const fetchWorkItemDetails = async (workItemId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/work-items/${workItemId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch work item details");
      }
      const data = await response.json();
      setSearchedWorkItem(data);
    } catch (error) {
      console.error("Error fetching work item details:", error.message || "Error fetching work item details");    }
  };


  useEffect(() => {
    if (!sdk.entry) return;
  
    // Get the stored work items from the entry
    const storedWorkItems = sdk.entry.fields.workItemId?.getValue();
  
    if (storedWorkItems && Array.isArray(storedWorkItems) && storedWorkItems.length > 0) {
      const workItemIds = storedWorkItems.map((item) => item.id); // Extract IDs
  
      // Fetch details for all stored work items
      fetchWorkItemDetails(workItemIds);
    }
  }, [sdk.entry]);
  useEffect(() => {
    if (!searchedWorkItem) return;
  
    const fetchAndUpdateSearchedWorkItem = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/work-items/${searchedWorkItem.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch work item details");
        }
        const data = await response.json();
  
        // Update only if there are changes
        if (JSON.stringify(data) !== JSON.stringify(searchedWorkItem)) {
          setSearchedWorkItem(data);
          console.log("Work item details updated!");
        }
      } catch (error) {
        console.error("Error fetching updated work item details:", error);
      }
    };
  
    const intervalId = setInterval(fetchAndUpdateSearchedWorkItem, 5000); // Poll every 5 seconds
  
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [searchedWorkItem]);
  
 useEffect(() => {
  const fetchAndUpdateLinkedWorkItems = async () => {
    if (!sdk.entry) return;

    const storedWorkItems = sdk.entry.fields.workItemId?.getValue();
    if (!storedWorkItems || !Array.isArray(storedWorkItems) || storedWorkItems.length === 0) {
      return;
    }

    try {
      const updatedWorkItems = await Promise.all(
        storedWorkItems.map(async (item) => {
          try {
            const response = await fetch(
              `http://localhost:3000/work-items/${item.id}`
            );
            if (!response.ok) {
              console.warn(`Failed to fetch details for work item ${item.id}`);
              return item; // Keep existing data if fetching fails
            }
            const data = await response.json();

            // Fetch release date from the self-link endpoint
            const releaseDate = await fetchSelfLinkData(item.id);

            return {
              id: item.id,
              state: data.fields?.['System.State'] || "Unknown",
              releaseDate: releaseDate || item.releaseDate, // Update release date if available
            };
          } catch (fetchError) {
            console.warn(`Error fetching details for work item ${item.id}:`, fetchError);
            return item; // Keep existing data if fetching fails
          }
        })
      );

      const hasUpdates = updatedWorkItems.some((newItem, index) => {
        const oldItem = storedWorkItems[index];
        return (
          newItem.state !== oldItem.state ||
          newItem.releaseDate !== oldItem.releaseDate
        );
      });

      if (hasUpdates) {
        sdk.entry.fields.workItemId.setValue(updatedWorkItems);
        console.log("Linked work items updated with release dates!");
      }
    } catch (error) {
      console.error("Error updating linked work items:", error);
    }
  };

  const intervalId = setInterval(fetchAndUpdateLinkedWorkItems, 5000); // Poll every 5 seconds

  return () => clearInterval(intervalId); // Cleanup on unmount
}, [sdk.entry]);
const unlinkWorkItem = () => {
  setSearchedWorkItem(null); // Clear the searched work item from the UI immediately

  const entry = sdk.entry;
  const workItemField = entry.fields?.workItemId;

  if (!workItemField) {
    console.error("workItemId field is missing from entry");
    return;
  }

  // Optimistically update the state to improve responsiveness
  setWorkItems([]); 

  // Clear the value in Contentful
  workItemField.setValue(null);
  entry
    .save()
    .then(() => {
      console.log("Work item unlinked successfully");
    })
    .catch((error) => {
      console.error("Failed to unlink work item:", error);

      // Rollback the optimistic update in case of an error
      const storedWorkItems = workItemField.getValue() || [];
      setWorkItems(storedWorkItems);
    });
};

  const openInAzure = (workItemId) => {
    const azureUrl = `https://bofaz.visualstudio.com/${process.env.REACT_APP_AZURE_DEVOPS_PROJECT}/_workitems/edit/${workItemId}`;
    window.open(azureUrl, "_blank");
  };

  return (
    <div>
    {searchedWorkItem && (
      <WorkItemDetails
        workItem={searchedWorkItem}
        onOpenInAzure={openInAzure}
        onUnlink={unlinkWorkItem}
      />
    )}
    {/* Conditionally render the search bar */}
    {!searchedWorkItem && (
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        error={error}
      />
    )}
    <main style={{ overflowX: "hidden",overflowY:"hidden" }}>
      {loading ? (
        <Stack flexDirection="column">
        
        <Spinner variant="primary" size="large"/>
        
      </Stack>
      ) : (
      
        <>
      {!searchedWorkItem && workItems.length > 0 && (
        <WorkItemsGrid
          workItems={workItems}
          onWorkItemClick={handleWorkItemClick}
        
        />
      )}
    </>
      )}
    </main>
  </div>
  );
};

export default Sidebar;
