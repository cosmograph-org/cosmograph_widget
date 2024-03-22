"""Base functionality of cosmograph"""

import importlib.metadata
import pathlib

import anywidget
import traitlets
import pyarrow as pa


_DEV = False  # switch to False for production

try:
    # TODO: Use importlib.resources instead of __file__
    project_root = pathlib.Path(__file__).parent.parent
    if _DEV:
        ESM = "http://localhost:5173/js/widget.ts?anywidget"
        CSS = ""
    else:
        ESM = (project_root / "cosmograph" / "static" / "widget.js").read_text()
        CSS = ""  # (pathlib.Path(__file__).parent / "static" / "style.css").read_text()
except FileNotFoundError as e:
    raise FileNotFoundError(
        f"{e}\nYou may need to run:\t`npm install --prefix {project_root}`"
    )

try:
    __version__ = importlib.metadata.version("cosmograph")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Cosmograph(anywidget.AnyWidget):
    # Attaches the JS side files
    _esm = ESM
    _css = CSS

    # Variables that the JS side is listening to. For private usage only
    _links_arrow_table_buffer = traitlets.Bytes().tag(sync=True)
    _nodes_arrow_table_buffer = traitlets.Bytes().tag(sync=True)

    # Data that Python can observe
    links = traitlets.Any()
    nodes = traitlets.Any()

    # Config parameters that Python can observe and the JS side is listening to
    render_links = traitlets.Bool(True).tag(sync=True)
    show_dynamic_labels = traitlets.Bool(True).tag(sync=True)
    # ...

    # Clicked node id that updates with the JS side
    clicked_node_id = traitlets.Unicode().tag(sync=True)
    # List of adjacent node ids to clicked node that updates with Python on message from JS side
    adjacent_node_ids_to_clicked_node = traitlets.List()

    def __init__(self, nodes=None, links=None, **kwargs):
        super().__init__(nodes=nodes, links=links, **kwargs)
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, data: dict, buffers: list):
        msg_type = data['msg_type']
        if msg_type == "adjacent_node_ids":
            self.adjacent_node_ids_to_clicked_node = data['adjacentNodeIds']

    @traitlets.observe("links")
    def on_links_change(self, change):
        self._links_arrow_table_buffer = self.get_buffered_arrow_table(change.new)

    @traitlets.observe("nodes")
    def on_nodes_change(self, change):
        self._nodes_arrow_table_buffer = self.get_buffered_arrow_table(change.new)

    # Convert a Pandas DataFrame into a binary format and then write it to an IPC (Inter-Process Communication) stream.
    # The `with` statement ensures that the IPC stream is properly closed after writing the data.
    def get_buffered_arrow_table(self, df):
        # TODO: Add support for input data with different formats (e.g. CSV, Appache Arrow, DuckDB, etc.)
        table = pa.Table.from_pandas(df)
        sink = pa.BufferOutputStream()
        with pa.ipc.new_stream(sink, table.schema) as writer:
            writer.write(table)
        buffer = sink.getvalue()
        return buffer.to_pybytes()


class TwCosmograph(anywidget.AnyWidget):
    # Attaches the JS side files
    _esm = ESM
    _css = CSS

    # Variables that the JS side is listening to. For private usage only
    _links_arrow_table_buffer = traitlets.Bytes().tag(sync=True)
    _nodes_arrow_table_buffer = traitlets.Bytes().tag(sync=True)

    # Data that Python can observe
    links = traitlets.Any()
    nodes = traitlets.Any()
    config = traitlets.Dict().tag(sync=True)  # the rest of the config parameters

    # Contain messages from TS side
    error_message = traitlets.Unicode().tag(sync=True)

    # # TODO: Why is this not equivalent to the init we're using now!?
    # def __init__(self, nodes=None, links=None, **kwargs):
    #     super().__init__(nodes, links=links, **kwargs)
    #     self.config = kwargs
    #     self.on_msg(self._handle_custom_msg)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.config = {k: v for k, v in kwargs.items() if k in {"links", "nodes"}}
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, data: dict, buffers: list):
        msg_type = data['msg_type']
        if msg_type == "adjacent_node_ids":
            self.adjacent_node_ids_to_clicked_node = data['adjacentNodeIds']

    @traitlets.observe("links")
    def on_links_change(self, change):
        self._links_arrow_table_buffer = self.get_buffered_arrow_table(change.new)

    @traitlets.observe("nodes")
    def on_nodes_change(self, change):
        self._nodes_arrow_table_buffer = self.get_buffered_arrow_table(change.new)

    # Convert a Pandas DataFrame into a binary format and then write it to an IPC (Inter-Process Communication) stream.
    # The `with` statement ensures that the IPC stream is properly closed after writing the data.
    def get_buffered_arrow_table(self, df):
        # TODO: Add support for input data with different formats (e.g. CSV, Appache Arrow, DuckDB, etc.)
        table = pa.Table.from_pandas(df)
        sink = pa.BufferOutputStream()
        with pa.ipc.new_stream(sink, table.schema) as writer:
            writer.write(table)
        buffer = sink.getvalue()
        return buffer.to_pybytes()


from cosmograph.util import config_schema_sig
from i2 import Sig

_cosmo_sig = Sig('(nodes=None, links=None)') + config_schema_sig
_cosmo_sig = _cosmo_sig.ch_kinds(
    **{name: Sig.KEYWORD_ONLY for name in _cosmo_sig.names}
)
_cosmo_sig = _cosmo_sig.ch_kinds(
    nodes=Sig.POSITIONAL_OR_KEYWORD, links=Sig.POSITIONAL_OR_KEYWORD
)


@_cosmo_sig
def cosmo(nodes=None, links=None, **kwargs):
    """Make a cosmograph widget.

    :param nodes: The nodes of the graph
    :param links: The links of the graph
    :param kwargs: Additional configuration parameters.

    To see what additional configuration parameters you can use and what then mean,
    you can have a look at: https://github.com/cosmograph-org/cosmos/wiki/Cosmos-configuration
    (Just remember to change JS-style CamelCase variables to python-style snake_case
    ones.)


    """
    if links is not None:
        kwargs.update(links=links)
    if nodes is not None:
        kwargs.update(nodes=nodes)
    return TwCosmograph(**kwargs)
