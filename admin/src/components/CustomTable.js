import React, { useState } from 'react';
import { useTable, usePagination, useSortBy } from 'react-table';
import Modal from 'react-modal';
import styles from '../styles/CustomTable.module.css';
import { fetchPlayerById, fetchPlayersBySigneeId } from '../services/api';
import { createFilledPDF } from '../tools/pdf-generator';

const CustomTable = ({ columns, data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultColumn = React.useMemo(
    () => ({}),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    usePagination
  );

  const handleViewMore = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const handlePdfGenerate = async (id) => {
    const players = await fetchPlayersBySigneeId(id);
    const primaryPlayer = await fetchPlayerById(id);
    const filteredPlayers = players.filter(player => player.PlayerID !== player.SigneeID);
    setLoading(true);
    try {
      const pdfBytes = await createFilledPDF(primaryPlayer, filteredPlayers);
      const uint8Array = new Uint8Array(pdfBytes);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agreement-filled.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading the PDF:', error);
    }
    setLoading(false);
  };

  const renderCellContent = (content, index, column) => {
    // Handle "Download Waiver" link only for the specific "Waiver" column in the Players table
    if (column.id === 'SigneeID' && typeof content === 'number') {
      return (
        <a href="#" onClick={(e) => { e.preventDefault(); handlePdfGenerate(content); }} className={styles.viewMoreLink}>
          {loading ? "Generating..." : "Download Waiver"}
        </a>
      );
    }

    if (typeof content === 'string') {
      if (content.length > 100) {
        const shortContent = content.substring(0, 100);
        return (
          <>
            {shortContent}...
            <a href="#" onClick={(e) => { e.preventDefault(); handleViewMore(content); }} className={styles.viewMoreLink}>View More</a>
          </>
        );
      }
      if (/<\/?[a-z][\s\S]*>/i.test(content)) {
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
      }
    } 
    return content;
  };

  return (
    <div className={styles['table-container']}>
      <table {...getTableProps()} className={styles.table}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())} className={styles.header}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell, index) => (
                  <td {...cell.getCellProps()} className={styles.cell}>
                    {cell.column.id === 'actions' 
                      ? cell.render('Cell')  // Render "Actions" column directly
                      : renderCellContent(cell.value, index, cell.column)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={columns.length}>
              <div className={styles.pagination}>
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                  {'<<'}
                </button>
                <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                  {'<'}
                </button>
                <button onClick={() => nextPage()} disabled={!canNextPage}>
                  {'>'}
                </button>
                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                  {'>>'}
                </button>
                <span>
                  Page{' '}
                  <strong>
                    {pageIndex + 1} of {pageOptions.length}
                  </strong>{' '}
                </span>
                <span>
                  | Go to page:{' '}
                  <input
                    type="number"
                    defaultValue={pageIndex + 1}
                    onChange={e => {
                      const page = e.target.value ? Number(e.target.value) - 1 : 0;
                      gotoPage(page);
                    }}
                    style={{ width: '50px' }}
                  />
                </span>{' '}
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Full Content"
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <div>
          <button onClick={() => setIsModalOpen(false)} className={styles.closeButton}>Close</button>
          <div dangerouslySetInnerHTML={{ __html: modalContent }} />
        </div>
      </Modal>
    </div>
  );
};

export default CustomTable;
