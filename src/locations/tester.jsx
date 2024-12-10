return (
    <div>
      {/* Search Input */}
      <TextInput
        placeholder="Search by Title"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleSearch}
        style={{ marginBottom: '20px' }}
      />
  
      {loading ? (
        <Flex justifyContent="center">
          <Spinner />
        </Flex>
      ) : error ? (
        <Paragraph style={{ color: 'red' }}>{error}</Paragraph>
      ) : !searchedWorkItem ? (
        <div>
          {/* Work Items Grid */}
          <Grid columns="1fr 1fr 1fr" rowGap="16px" columnGap="16px">
            {workItems.map((item) => (
              <Card
                key={item.id}
                title={item.fields["System.Title"]}
                onClick={() => {
                  setSearchedWorkItem(item);
                  linkWorkItemToEntry(item);
                }}
                style={{ cursor: 'pointer' }}
              >
                <Paragraph>
                  <strong>Title:</strong> {item.fields["System.Title"]}
                </Paragraph>
                <Paragraph>
                  <strong>Assigned To:</strong>{' '}
                  {item.fields["System.AssignedTo"]?.displayName || 'Unassigned'}
                </Paragraph>
                <Paragraph>
                  <strong>State:</strong> {item.fields["System.State"]}
                </Paragraph>
              </Card>
            ))}
          </Grid>
  
          {/* Pagination Controls */}
          <Flex justifyContent="space-between" alignItems="center" style={{ marginTop: '20px' }}>
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              isDisabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Paragraph>
              Page {currentPage} of {totalPages}
            </Paragraph>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              isDisabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </Flex>
        </div>
      ) : (
        <Card>
          <Flex justifyContent="space-between" alignItems="center" style={{ marginBottom: '16px' }}>
            <h3>Work Item Details</h3>
            <IconButton
              variant="transparent"
              icon={<MoreVerticalIcon />}
              aria-label="Actions"
            />
          </Flex>
          <Paragraph>
            <strong>Title:</strong> {searchedWorkItem.fields["System.Title"]}
          </Paragraph>
          <Paragraph>
            <strong>Assigned To:</strong>{' '}
            {searchedWorkItem.fields["System.AssignedTo"]?.displayName || 'Unassigned'}
          </Paragraph>
          <Paragraph>
            <strong>State:</strong> {searchedWorkItem.fields["System.State"]}
          </Paragraph>
          <Paragraph>
            <strong>Created By:</strong>{' '}
            {searchedWorkItem.fields["System.CreatedBy"]?.displayName || 'Unknown'}
          </Paragraph>
          <Paragraph>
            <strong>Created Date:</strong>{' '}
            {new Date(searchedWorkItem.fields["System.CreatedDate"]).toLocaleString()}
          </Paragraph>
        </Card>
      )}
    </div>
  );