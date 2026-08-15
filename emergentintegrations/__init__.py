__version__ = "0.1.0"

# Lightweight local shim for emergentintegrations used during development/deploys.
# This package provides minimal implementations of the interfaces the app imports
# so the backend can start even when the upstream `emergentintegrations` package
# is not installed. It returns safe mock responses when an actual AI key
# (EMERGENT_LLM_KEY) is not configured.
